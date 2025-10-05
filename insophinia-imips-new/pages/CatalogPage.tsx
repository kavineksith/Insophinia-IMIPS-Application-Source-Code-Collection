

import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { InventoryItem, CartItem, Discount, DiscountType, Order } from '../types';
import { useToast } from '../hooks/useToast';
import { ShoppingCartIcon, PlusIcon, MinusIcon, TrashIcon, ShieldCheckIcon, ArrowRightCircleIcon, TicketIcon } from '@heroicons/react/24/solid';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import AuthenticatedImage from '../components/common/AuthenticatedImage';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { validateDiscount } from '../lib/api';
import PageHeader from '../components/common/PageHeader';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const CartSidebar: React.FC<{
    cart: CartItem[];
    onUpdateQuantity: (itemId: string, newQuantity: number) => void;
    onRemove: (itemId: string) => void;
    onCheckout: (customerDetails: { customerName: string; customerContact: string; customerAddress: string; customerEmail: string; }, discountId: string | null) => Promise<Order | null>;
    onClearCart: () => void;
}> = ({ cart, onUpdateQuantity, onRemove, onCheckout, onClearCart }) => {
    
    const { inventory } = useData();
    const { showToast } = useToast();
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isConfirmClearCartOpen, setIsConfirmClearCartOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<{ id: string, amount: number, description: string } | null>(null);
    const [customerDetails, setCustomerDetails] = useState({
        customerName: '',
        customerContact: '',
        customerAddress: '',
        customerEmail: ''
    });
    const [errors, setErrors] = useState({ customerName: null, customerEmail: null, customerContact: null, customerAddress: null } as Record<string, string | null>);
    const [isFormValid, setIsFormValid] = useState(false);

    useEffect(() => {
        const nameError = validate(customerDetails.customerName, [VALIDATION_RULES.required, VALIDATION_RULES.name]);
        const emailError = validate(customerDetails.customerEmail, [VALIDATION_RULES.required, VALIDATION_RULES.email]);
        const contactError = validate(customerDetails.customerContact, [VALIDATION_RULES.required, VALIDATION_RULES.phone]);
        const addressError = validate(customerDetails.customerAddress, [VALIDATION_RULES.required]);

        setErrors({ customerName: nameError, customerEmail: emailError, customerContact: contactError, customerAddress: addressError });
        setIsFormValid(!nameError && !emailError && !contactError && !addressError);
    }, [customerDetails]);

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
    const totalItems = cart.reduce((acc, item) => acc + item.cartQuantity, 0);
    
    const total = Math.max(0, subtotal - (appliedDiscount?.amount || 0));
    
    const handleApplyDiscount = async () => {
        if (!discountCode) return;
        try {
            const result = await validateDiscount(discountCode, subtotal, totalItems);
            if (result.valid) {
                setAppliedDiscount({
                    id: result.discount.id,
                    amount: result.discount_amount,
                    description: result.discount.description
                });
                showToast(`Discount "${result.discount.code}" applied!`, 'success');
            }
        } catch (error: any) {
            setAppliedDiscount(null);
            showToast(error.response?.data?.message || 'Invalid discount code', 'error');
        }
    };

    const handleCustomerDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCustomerDetails(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsProcessing(true);
        const newOrder = await onCheckout(customerDetails, appliedDiscount?.id || null);
        if (newOrder) {
            showToast(`Order #${newOrder.id.substring(0,8)}... created & receipt sent to customer!`, 'success');
            setIsCheckoutModalOpen(false);
            setCustomerDetails({ customerName: '', customerContact: '', customerAddress: '', customerEmail: '' });
            setDiscountCode('');
            setAppliedDiscount(null);
        }
        setIsProcessing(false);
    }
    
    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        const inventoryItem = inventory.find(i => i.id === itemId);
        if (inventoryItem && newQuantity > 0 && newQuantity > inventoryItem.quantity) {
            showToast(`Not enough stock for ${inventoryItem.name}. Only ${inventoryItem.quantity} available.`, 'error');
            return;
        }
        setAppliedDiscount(null);
        onUpdateQuantity(itemId, newQuantity);
    };

    const confirmClearCart = () => {
        onClearCart();
        setIsConfirmClearCartOpen(false);
        setAppliedDiscount(null);
        setDiscountCode('');
        showToast('Cart cleared successfully.', 'success');
    };

    return (
        <Card className="w-full lg:w-1/3 h-full flex flex-col">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <ShoppingCartIcon className="h-7 w-7 mr-3 text-brand-primary" />
                    Shopping Cart
                </h2>
                {cart.length > 0 && (
                    <button
                        onClick={() => setIsConfirmClearCartOpen(true)}
                        className="text-sm text-red-500 hover:text-red-700 font-semibold flex items-center p-1 rounded hover:bg-red-50 transition-colors"
                        title="Clear Cart"
                    >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Clear
                    </button>
                )}
            </div>
            {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    Your cart is empty.
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2">
                    {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between mb-4 pb-4 border-b">
                            <AuthenticatedImage type="product" src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-lg object-cover mr-4" />
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800">{item.name}</p>
                                <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                            </div>
                            <div className="flex items-center">
                                <button onClick={() => handleUpdateQuantity(item.id, item.cartQuantity - 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><MinusIcon className="h-4 w-4" /></button>
                                <span className="w-10 text-center font-medium">{item.cartQuantity}</span>
                                <button onClick={() => handleUpdateQuantity(item.id, item.cartQuantity + 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><PlusIcon className="h-4 w-4" /></button>
                            </div>
                            <button onClick={() => onRemove(item.id)} className="ml-4 text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button>
                        </div>
                    ))}
                </div>
            )}
            {cart.length > 0 && (
                <div className="border-t pt-4 mt-4 space-y-2">
                    <div className="flex justify-between items-center gap-2">
                        <div className="relative flex-grow">
                             <TicketIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2"/>
                             <input type="text" placeholder="Discount Code" value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} className="w-full p-2 pl-10 border rounded-lg"/>
                        </div>
                        <button onClick={handleApplyDiscount} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">Apply</button>
                    </div>

                    <div className="flex justify-between text-gray-700"><span>Subtotal:</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                    {appliedDiscount && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount ({appliedDiscount.description}):</span>
                            <span className="font-medium">-{formatCurrency(appliedDiscount.amount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t mt-2"><span>Total:</span><span>{formatCurrency(total)}</span></div>
                    <button onClick={() => setIsCheckoutModalOpen(true)} className="w-full mt-4 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-secondary transition-colors flex items-center justify-center">
                        Proceed to Checkout
                        <ArrowRightCircleIcon className="h-5 w-5 ml-2" />
                    </button>
                </div>
            )}
            <Modal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} title="Confirm Order">
                <form onSubmit={handleCheckoutSubmit} className="space-y-4" noValidate>
                    <p>Please enter the customer details to finalize this order.</p>
                    <ValidatedInput
                        label="Customer Name"
                        type="text"
                        name="customerName"
                        value={customerDetails.customerName}
                        onChange={handleCustomerDetailsChange}
                        error={errors.customerName}
                        required
                    />
                    <ValidatedInput
                        label="Customer Email"
                        type="email"
                        name="customerEmail"
                        value={customerDetails.customerEmail}
                        onChange={handleCustomerDetailsChange}
                        error={errors.customerEmail}
                        required
                    />
                    <ValidatedInput
                        label="Customer Contact Number"
                        type="tel"
                        name="customerContact"
                        value={customerDetails.customerContact}
                        onChange={handleCustomerDetailsChange}
                        error={errors.customerContact}
                        required
                    />
                    <ValidatedInput
                        label="Customer Delivery Address"
                        as="textarea"
                        name="customerAddress"
                        value={customerDetails.customerAddress}
                        onChange={handleCustomerDetailsChange}
                        error={errors.customerAddress}
                        rows={3}
                        required
                    />
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setIsCheckoutModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={isProcessing}>Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:bg-gray-400" disabled={isProcessing || !isFormValid}>
                            {isProcessing ? 'Processing...' : 'Confirm & Checkout'}
                        </button>
                    </div>
                </form>
            </Modal>
             <ConfirmationModal
                isOpen={isConfirmClearCartOpen}
                onClose={() => setIsConfirmClearCartOpen(false)}
                onConfirm={confirmClearCart}
                title="Clear Cart"
                message="Are you sure you want to empty your cart? This action cannot be undone."
                variant="destructive"
            />
        </Card>
    );
};


const CatalogPage: React.FC = () => {
    const { inventory, cart, addToCart, updateCartQuantity, removeFromCart, checkout, clearCart, isLoading, refreshData } = useData();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    const handleAddToCart = (item: InventoryItem) => {
        if (addToCart(item, 1)) {
            showToast(`${item.name} added to cart!`, 'success');
        } else {
            showToast(`Not enough stock for ${item.name}.`, 'error');
        }
    };
    
    const handleCheckout = (customerDetails: { customerName: string; customerContact: string; customerAddress: string; customerEmail: string; }, discountId: string | null): Promise<Order | null> => {
        return checkout(customerDetails, discountId);
    };

    const categories = ['All', ...new Set(inventory.map(item => item.category))];

    const filteredInventory = inventory.filter(item =>
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (categoryFilter === 'All' || item.category === categoryFilter)
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-100px)]">
            <div className="flex-1 flex flex-col">
                <PageHeader 
                    title="Product Catalog"
                    icon={ShoppingCartIcon}
                    onRefresh={refreshData}
                />

                 <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border rounded-lg flex-1"
                    />
                     <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="p-2 border rounded-lg flex-1 bg-white"
                        aria-label="Filter by category"
                    >
                         {categories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>)}
                    </select>
                </div>
                {isLoading ? <div className="text-center py-10">Loading catalog...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-4 pr-2">
                    {filteredInventory.map(item => {
                        const cartItem = cart.find(ci => ci.id === item.id);
                        const quantityInCart = cartItem ? cartItem.cartQuantity : 0;
                        const isOutOfStock = item.quantity === 0;
                        const isMaxInCart = !isOutOfStock && quantityInCart >= item.quantity;
                        const isDisabled = isOutOfStock || isMaxInCart;

                        return (
                            <Card key={item.id} className="flex flex-col">
                                <AuthenticatedImage type="product" src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover rounded-t-lg -m-6 mb-0" />
                                <div className="mt-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                                    <p className="text-sm text-gray-500">{item.category}</p>
                                    <p className="text-xs text-gray-600 mt-2 flex items-center">
                                        <ShieldCheckIcon className="h-4 w-4 mr-1 text-gray-400" />
                                        Warranty: <strong>{Number(item.warrantyPeriod) || 0} months</strong>
                                    </p>
                                    <div className="flex-1" />
                                    <div className="mt-4 flex justify-between items-center">
                                        <div>
                                            <p className="text-xl font-semibold text-brand-primary">{formatCurrency(item.price)}</p>
                                            <div className="flex items-baseline">
                                                <p className={`text-sm ${isOutOfStock ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                                                    {isOutOfStock ? 'Out of Stock' : `${item.quantity} in stock`}
                                                </p>
                                                {quantityInCart > 0 && !isOutOfStock && (
                                                    <span className="text-xs text-gray-500 ml-2">({quantityInCart} in cart)</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddToCart(item)}
                                            disabled={isDisabled}
                                            className={`px-4 py-2 text-white rounded-lg shadow transition-colors ${
                                                isMaxInCart 
                                                ? 'bg-yellow-400 cursor-not-allowed' 
                                                : 'bg-brand-accent hover:bg-brand-secondary disabled:bg-gray-300 disabled:cursor-not-allowed'
                                            }`}
                                        >
                                            {isMaxInCart ? 'Max in Cart' : 'Add to Cart'}
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                     {filteredInventory.length === 0 && <p className="text-gray-500 md:col-span-2 xl:col-span-3 text-center py-8">No products found matching your criteria.</p>}
                </div>
                )}
            </div>
            
            <CartSidebar 
                cart={cart}
                onUpdateQuantity={updateCartQuantity}
                onRemove={removeFromCart}
                onCheckout={handleCheckout}
                onClearCart={clearCart}
            />
        </div>
    );
};

export default CatalogPage;
