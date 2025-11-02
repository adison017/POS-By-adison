import { supabase } from '../supabaseClient'

// Menu Categories
export const getMenuCategories = async () => {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order')
  
  if (error) {
    console.error('Error fetching menu categories:', error)
    return []
  }
  
  return data
}

export const createMenuCategory = async (category) => {
  const { data, error } = await supabase
    .from('menu_categories')
    .insert([category])
    .select()
  
  if (error) {
    console.error('Error creating menu category:', error)
    return { error }
  }
  
  return { data: data[0] }
}

export const updateMenuCategory = async (id, updates) => {
  const { data, error } = await supabase
    .from('menu_categories')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating menu category:', error)
    return { error }
  }
  
  return { data: data[0] }
}

// Menu Items
export const getMenuItems = async () => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_active', true)
  
  if (error) {
    console.error('Error fetching menu items:', error)
    return []
  }
  
  return data
}

export const createMenuItem = async (item) => {
  // Only include fields that exist in the database schema
  const menuItemData = {
    id: item.id,
    category_id: item.category_id,
    name: item.name,
    price: item.price,
    cost_default: item.cost_default,
    image_url: item.image_url,
    is_active: item.is_active,
    branch_id: item.branch_id,
    created_at: item.created_at,
    updated_at: item.updated_at
  };

  const { data, error } = await supabase
    .from('menu_items')
    .insert([menuItemData])
    .select()
  
  if (error) {
    console.error('Error creating menu item:', error)
    return { error }
  }
  
  return { data: data[0] }
}

export const updateMenuItem = async (id, updates) => {
  // Only include fields that exist in the database schema
  const menuItemUpdates = {
    category_id: updates.category_id,
    name: updates.name,
    price: updates.price,
    cost_default: updates.cost_default,
    image_url: updates.image_url,
    is_active: updates.is_active,
    branch_id: updates.branch_id,
    updated_at: updates.updated_at
  };

  const { data, error } = await supabase
    .from('menu_items')
    .update(menuItemUpdates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating menu item:', error)
    return { error }
  }
  
  return { data: data[0] }
}

// Orders
export const getOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }
  
  return data
}

export const createOrder = async (order) => {
  console.log('Creating order:', order);
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
    
    if (error) {
      console.error('Error creating order:', error)
      return { error }
    }
    
    console.log('Order created successfully:', data);
    return { data: data[0] }
  } catch (error) {
    console.error('Error creating order:', error);
    return { error }
  }
}

export const updateOrder = async (id, updates) => {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating order:', error)
    return { error }
  }
  
  return { data: data[0] }
}

// Order Items
export const getOrderItems = async (orderId) => {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
  
  if (error) {
    console.error('Error fetching order items:', error)
    return []
  }
  
  return data
}

export const createOrderItem = async (item) => {
  console.log('Creating order item:', item);
  const { data, error } = await supabase
    .from('order_items')
    .insert([item])
    .select()
  
  if (error) {
    console.error('Error creating order item:', error)
    return { error }
  }
  
  return { data: data[0] }
}

// Kitchen Tickets
export const getKitchenTickets = async () => {
  const { data, error } = await supabase
    .from('kitchen_tickets')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching kitchen tickets:', error)
    return []
  }
  
  return data
}

export const createKitchenTicket = async (ticket) => {
  const { data, error } = await supabase
    .from('kitchen_tickets')
    .insert([ticket])
    .select()
  
  if (error) {
    console.error('Error creating kitchen ticket:', error)
    return { error }
  }
  
  return { data: data[0] }
}

export const updateKitchenTicket = async (id, updates) => {
  const { data, error } = await supabase
    .from('kitchen_tickets')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating kitchen ticket:', error)
    return { error }
  }
  
  return { data: data[0] }
}

// Payment Methods
export const getPaymentMethods = async () => {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('is_active', true)
    .order('display_order')
  
  if (error) {
    console.error('Error fetching payment methods:', error)
    return []
  }
  
  return data
}

export const createPaymentMethod = async (paymentMethod) => {
  const { data, error } = await supabase
    .from('payment_methods')
    .insert([paymentMethod])
    .select()
  
  if (error) {
    console.error('Error creating payment method:', error)
    return { error }
  }
  
  return { data: data[0] }
}

export const updatePaymentMethod = async (id, updates) => {
  const { data, error } = await supabase
    .from('payment_methods')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating payment method:', error)
    return { error }
  }
  
  return { data: data[0] }
}

// Expenses
export const getExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching expenses:', error)
    return []
  }
  
  return data
}

export const createExpense = async (expense) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select()
  
  if (error) {
    console.error('Error creating expense:', error)
    return { error }
  }
  
  return { data: data[0] }
}

// Income
export const getIncome = async () => {
  const { data, error } = await supabase
    .from('income')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching income:', error)
    return []
  }
  
  return data
}

export const createIncome = async (income) => {
  const { data, error } = await supabase
    .from('income')
    .insert([income])
    .select()
  
  if (error) {
    console.error('Error creating income:', error)
    return { error }
  }
  
  return { data: data[0] }
}