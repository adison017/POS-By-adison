import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as DataService from '../services/dataService';

const POS = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentOrder, setCurrentOrder] = useState({
    items: [],
    subtotal: 0,
    discount: 0,
    grandTotal: 0
  });
  const [currentOrderNumber, setCurrentOrderNumber] = useState(1);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, menuItemsData, paymentMethodsData] = await Promise.all([
          DataService.getMenuCategories(),
          DataService.getMenuItems(),
          DataService.getPaymentMethods()
        ]);
        setCategories(categoriesData);
        setMenuItems(menuItemsData);
        setPaymentMethods(paymentMethodsData);
        
        // Set default payment method if available
        if (paymentMethodsData.length > 0) {
          setSelectedPaymentMethod(paymentMethodsData[0].id);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Load the latest order to determine the next order number
  useEffect(() => {
    const loadLatestOrder = async () => {
      try {
        const orders = await DataService.getOrders();
        if (orders && orders.length > 0) {
          // Sort orders by order_no to find the highest number
          const sortedOrders = orders
            .filter(order => order.order_no && order.order_no.startsWith('ORD'))
            .sort((a, b) => {
              const numA = parseInt(a.order_no.replace('ORD', ''));
              const numB = parseInt(b.order_no.replace('ORD', ''));
              return numB - numA;
            });
          
          if (sortedOrders.length > 0) {
            const latestOrderNo = sortedOrders[0].order_no;
            const latestNumber = parseInt(latestOrderNo.replace('ORD', ''));
            setCurrentOrderNumber(latestNumber + 1);
          } else {
            setCurrentOrderNumber(1);
          }
        } else {
          setCurrentOrderNumber(1);
        }
      } catch (error) {
        console.error('Error loading latest order:', error);
        setCurrentOrderNumber(1);
      }
    };

    loadLatestOrder();
  }, []);

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category_id === selectedCategory);

  const addToOrder = (itemId) => {
    const menuItem = menuItems.find(item => item.id === itemId);
    if (!menuItem) return;

    setCurrentOrder(prevOrder => {
      const existingItem = prevOrder.items.find(item => item.id === itemId);
      
      let updatedItems;
      if (existingItem) {
        updatedItems = prevOrder.items.map(item => 
          item.id === itemId 
            ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * item.price } 
            : item
        );
      } else {
        updatedItems = [
          ...prevOrder.items,
          {
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            cost: menuItem.cost_default || 0,
            qty: 1,
            total: menuItem.price
          }
        ];
      }

      const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const grandTotal = subtotal - prevOrder.discount;

      return {
        items: updatedItems,
        subtotal,
        discount: prevOrder.discount,
        grandTotal
      };
    });
  };

  const updateItemQuantity = (itemId, action) => {
    setCurrentOrder(prevOrder => {
      let updatedItems;
      
      if (action === 'increase') {
        updatedItems = prevOrder.items.map(item => 
          item.id === itemId 
            ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * item.price } 
            : item
        );
      } else if (action === 'decrease') {
        updatedItems = prevOrder.items.map(item => 
          item.id === itemId 
            ? { ...item, qty: item.qty - 1, total: (item.qty - 1) * item.price } 
            : item
        ).filter(item => item.qty > 0);
      }

      const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const grandTotal = subtotal - prevOrder.discount;

      return {
        items: updatedItems,
        subtotal,
        discount: prevOrder.discount,
        grandTotal
      };
    });
  };

  const clearOrder = () => {
    setCurrentOrder({
      items: [],
      subtotal: 0,
      discount: 0,
      grandTotal: 0
    });
  };

  const openPaymentModal = () => {
    if (currentOrder.items.length === 0) return;
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentMethod(paymentMethods.length > 0 ? paymentMethods[0].id : '');
  };

  const processPayment = async () => {
    if (currentOrder.items.length === 0) return;
    if (!selectedPaymentMethod) {
      toast.error('กรุณาเลือกวิธีการชำระเงิน');
      return;
    }

    try {
      // Generate a unique order number based on currentOrderNumber
      const orderNo = `ORD${String(currentOrderNumber).padStart(4, '0')}`;
      
      // Create order record
      const orderData = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique ID
        order_no: orderNo,
        status: 'paid',
        subtotal: currentOrder.subtotal,
        grand_total: currentOrder.grandTotal,
        payment_method: selectedPaymentMethod,
        branch_id: 'branch1',
        cashier_id: 'cashier1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating order with data:', orderData);
      const orderResult = await DataService.createOrder(orderData);
      console.log('Order result:', orderResult);
      
      if (orderResult.error) {
        console.error('Failed to create order:', orderResult.error);
        toast.error('ไม่สามารถสร้างออเดอร์ได้ กรุณาลองใหม่อีกครั้ง');
        throw new Error('Failed to create order: ' + orderResult.error.message);
      }

      // Create order items
      for (const item of currentOrder.items) {
        const orderItemData = {
          id: `order_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique ID
          order_id: orderResult.data.id,
          item_id: item.id,
          name: item.name,
          qty: item.qty,
          unit_price: item.price,
          total_price: item.total,
          created_at: new Date().toISOString()
        };

        console.log('Creating order item with data:', orderItemData);
        const itemResult = await DataService.createOrderItem(orderItemData);
        console.log('Order item result:', itemResult);
        
        if (itemResult.error) {
          console.error('Failed to create order item:', itemResult.error);
          toast.error('ไม่สามารถบันทึกรายการอาหารได้ กรุณาลองใหม่อีกครั้ง');
          throw new Error('Failed to create order item: ' + itemResult.error.message);
        }
      }

      // Clear order and increment order number
      clearOrder();
      setCurrentOrderNumber(prev => prev + 1);
      setShowPaymentModal(false);
      
      toast.success('ชำระเงินเรียบร้อยแล้ว!');
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง');
    }
  };

  const formatCurrency = (amount) => {
    return `฿${amount.toFixed(2)}`;
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ระบบขายหน้าร้าน (POS)</h1>
          <p className="text-gray-600">จัดการออเดอร์และชำระเงินอย่างรวดเร็ว</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
          {/* Menu Section */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
              {/* Category Filter */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">เมนูอาหาร</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      selectedCategory === 'all'
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        selectedCategory === category.id
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Grid */}
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-gray-300 mb-4">
                    <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">ไม่มีรายการเมนู</h3>
                  <p className="text-gray-500">กรุณาเพิ่มเมนูในหน้า "เมนู"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredMenuItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addToOrder(item.id)}
                      className="bg-white rounded-2xl p-4 text-left border border-gray-100 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-28 object-cover rounded-xl mb-3 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                      )}
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 text-sm leading-tight flex-1 mr-2">{item.name}</h3>
                          <span className="font-bold text-lg text-emerald-600 whitespace-nowrap">{formatCurrency(item.price)}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description || 'ไม่มีคำอธิบาย'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Section */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 h-full flex flex-col">
              {/* Order Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">ออเดอร์ปัจจุบัน</h2>
                {currentOrder.items.length > 0 && (
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md">
                    #{`ORD${String(currentOrderNumber).padStart(4, '0')}`}
                  </div>
                )}
              </div>
              
              {currentOrder.items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <div className="text-gray-200 mb-6">
                    <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">ยังไม่มีรายการ</h3>
                  <p className="text-gray-500 mb-4">เพิ่มรายการจากเมนูด้านซ้าย</p>
                  <div className="text-gray-400 text-sm">
                    คลิกที่เมนูอาหารเพื่อเพิ่มลงในออเดอร์
                  </div>
                </div>
              ) : (
                <>
                  {/* Order Items */}
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-6">
                    {currentOrder.items.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-3 last:mb-0 border border-gray-100 hover:border-gray-200 transition-colors duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-800 truncate pr-2">{item.name}</h3>
                            <span className="font-bold text-gray-800 text-lg">{formatCurrency(item.total)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{formatCurrency(item.price)} × {item.qty}</p>
                            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                              <button 
                                onClick={() => updateItemQuantity(item.id, 'decrease')}
                                className="p-2 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                                </svg>
                              </button>
                              <span className="px-3 py-1 text-sm font-bold text-gray-700 min-w-8 text-center">{item.qty}</span>
                              <button 
                                onClick={() => updateItemQuantity(item.id, 'increase')}
                                className="p-2 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6 border border-gray-200">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">รวมย่อย:</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(currentOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">ส่วนลด:</span>
                        <span className="font-semibold text-red-500">-{formatCurrency(currentOrder.discount)}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-3 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-800">รวมทั้งหมด:</span>
                          <span className="text-2xl font-bold text-emerald-600">{formatCurrency(currentOrder.grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button 
                      onClick={clearOrder}
                      className="flex-1 py-4 px-6 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 rounded-xl font-bold hover:from-gray-200 hover:to-gray-300 transition-all duration-300 shadow hover:shadow-md border border-gray-200"
                    >
                      ล้างออเดอร์
                    </button>
                    <button 
                      onClick={openPaymentModal}
                      className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      ชำระเงิน
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform animate-scale-in border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800">ชำระเงิน</h3>
              <button 
                onClick={closePaymentModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="mb-8">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl p-6 mb-6 text-center">
                <div className="text-sm opacity-90 mb-1">ออเดอร์ #</div>
                <div className="text-2xl font-bold mb-2">{`ORD${String(currentOrderNumber).padStart(4, '0')}`}</div>
                <div className="text-3xl font-bold">{formatCurrency(currentOrder.grandTotal)}</div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-4">เลือกวิธีการชำระเงิน</label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map(method => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all duration-300 ${
                        selectedPaymentMethod === method.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-md scale-105'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'
                      }`}
                    >
                      {method.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={closePaymentModal}
                className="flex-1 py-4 px-6 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 rounded-xl font-bold hover:from-gray-200 hover:to-gray-300 transition-all duration-300 shadow border border-gray-200"
              >
                ยกเลิก
              </button>
              <button 
                onClick={processPayment}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                ยืนยันการชำระ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default POS;