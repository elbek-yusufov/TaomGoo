import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_URL, USE_MOCK } from '../lib/api-client';
import { useAuthStore } from '../stores/authStore';
import { useSoundStore } from '../stores/soundStore';
import { Order, OrderStatus } from '../types';
import { mockDb } from '../lib/mock/mockState';

interface KitchenSocketEvents {
  onNewOrder?: (order: Order) => void;
  onOrderStatusChanged?: (orderId: string, oldStatus: OrderStatus, newStatus: OrderStatus, order: Order) => void;
}

export function useKitchenSocket(events?: KitchenSocketEvents) {
  const [isConnected, setIsConnected] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const mockIntervalRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const { playNewOrderSound } = useSoundStore();

  const handleIncomingNewOrder = useCallback(
    (order: Order) => {
      setNewOrderCount((prev) => prev + 1);
      setNewOrderAlert(`Yangi buyurtma keldi: #${order.order_number} (${order.table_or_phone})`);
      playNewOrderSound();
      events?.onNewOrder?.(order);

      // Clean alert announcement after 5s
      setTimeout(() => {
        setNewOrderAlert(null);
      }, 5000);
    },
    [events, playNewOrderSound]
  );

  const handleIncomingStatusChange = useCallback(
    (orderId: string, oldStatus: OrderStatus, newStatus: OrderStatus, order: Order) => {
      events?.onOrderStatusChanged?.(orderId, oldStatus, newStatus, order);
    },
    [events]
  );

  // Update document title when new orders arrive
  useEffect(() => {
    if (newOrderCount > 0) {
      document.title = `(${newOrderCount}) Yangi buyurtma! - TaomGo Oshxona`;
    } else {
      document.title = 'Oshxona - TaomGo';
    }
  }, [newOrderCount]);

  const clearNewOrderBadge = useCallback(() => {
    setNewOrderCount(0);
  }, []);

  useEffect(() => {
    if (USE_MOCK) {
      // In Mock Mode: simulate active socket connection & subscribe to mockDb
      setIsConnected(true);

      const unsubscribe = mockDb.subscribe((event) => {
        if (event.type === 'new_order') {
          handleIncomingNewOrder(event.order);
        } else if (event.type === 'order_status_changed') {
          handleIncomingStatusChange(event.order_id, event.old_status, event.new_status, event.order);
        }
      });

      // Periodically simulate a realistic guest or takeaway order every 30-40 seconds
      const scheduleNextMockOrder = () => {
        const delay = Math.floor(Math.random() * 15000) + 25000; // 25-40s
        mockIntervalRef.current = window.setTimeout(() => {
          const sampleFoods = [
            { food: 'food_1', quantity: 2 },
            { food: 'food_11', quantity: 1 },
            { food: 'food_13', quantity: 1 },
          ];
          const sampleTables = ['tbl_2', 'tbl_4', 'tbl_6', 'tbl_7', 'tbl_9'];
          const randTable = sampleTables[Math.floor(Math.random() * sampleTables.length)];
          const tblObj = mockDb.tables.find((t) => t.id === randTable);

          mockDb.addOrder({
            table: tblObj ? tblObj.id : null,
            table_or_phone: tblObj ? `Stol #${tblObj.number} (${tblObj.hall})` : '+998 90 987 65 43',
            order_type: tblObj ? 'dine_in' : 'takeaway',
            waiter_name: 'Rustam Aliyev',
            payment_type: 'cash',
            service_fee_percent: 10,
            items: sampleFoods,
            notes: 'Mijoz talabi bilan yangi kelgan buyurtma',
          });

          scheduleNextMockOrder();
        }, delay);
      };

      scheduleNextMockOrder();

      return () => {
        unsubscribe();
        if (mockIntervalRef.current) clearTimeout(mockIntervalRef.current);
      };
    }

    // Real WebSocket implementation
    const access = useAuthStore.getState().tokens?.access;
    const socketUrl = `${WS_URL}/ws/kitchen/?token=${encodeURIComponent(access || '')}`;

    function connect() {
      try {
        const ws = new WebSocket(socketUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          reconnectAttemptRef.current = 0;

          // Send ping every 25s
          pingIntervalRef.current = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'pong') {
              // Heartbeat acknowledged
              return;
            }
            if (data.type === 'connection_established') {
              setIsConnected(true);
            } else if (data.type === 'new_order') {
              handleIncomingNewOrder(data.order);
            } else if (data.type === 'order_status_changed') {
              handleIncomingStatusChange(data.order_id, data.old_status, data.new_status, data.order);
            }
          } catch (e) {
            console.error('WS parse error', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

          // Exponential backoff reconnect: min 1s, max 30s
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptRef.current), 30000);
          reconnectAttemptRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(connect, delay);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (e) {
        console.error('WS error', e);
      }
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [handleIncomingNewOrder, handleIncomingStatusChange]);

  return {
    isConnected,
    newOrderAlert,
    newOrderCount,
    clearNewOrderBadge,
  };
}
