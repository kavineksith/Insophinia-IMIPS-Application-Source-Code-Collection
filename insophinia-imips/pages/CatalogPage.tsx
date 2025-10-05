import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { InventoryItem, CartItem, Discount, DiscountType, Order } from '../types';
import { useToast } from '../hooks/useToast';
import { ShoppingCartIcon, PlusIcon, MinusIcon, TrashIcon, ShieldCheckIcon, ArrowRightCircleIcon } from '@heroicons/react/24/solid';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import AuthenticatedImage from '../components/common/AuthenticatedImage';
import ValidatedInput from '../components/common/ValidatedInput';
import { validate, VALIDATION_RULES } from '../lib/validation';
import ConfirmationModal from '../components/common/ConfirmationModal';


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const CartSidebar: React.FC<{
    cart: CartItem[];
    discounts: Discount[];
    onUpdateQuantity: (itemId: string, newQuantity: number) => void;
    onRemove: (itemId: string) => void;
    onCheckout: (customerDetails: { customerName: string; customerContact: string; customerAddress: string; customerEmail: string; }) => Promise<Order | null>;
    onClearCart: () => void;
}> = ({ cart, discounts, onUpdateQuantity, onRemove, onCheckout, onClearCart }) => {
    
    const { inventory } = useData();
    const { showToast } = useToast();
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isConfirmClearCartOpen, setIsConfirmClearCartOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
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

    let applicableDiscount: Discount | null = null;
    let discountAmount = 0;

    discounts.forEach(disc => {
        if (!disc.isActive) return;
        const meetsMinSpend = !disc.condition.minSpend || subtotal >= disc.condition.minSpend;
        const meetsMinItems = !disc.condition.minItems || totalItems >= disc.condition.minItems;
        if (meetsMinSpend && meetsMinItems) {
            if (!applicableDiscount || disc.value > applicableDiscount.value) { // Simple logic: best discount value wins
                applicableDiscount = disc;
            }
        }
    });
    
    if (applicableDiscount) {
        if (applicableDiscount.type === DiscountType.Percentage) {
            discountAmount = (subtotal * applicableDiscount.value) / 100;
        } else if (applicableDiscount.type === DiscountType.FixedAmount) {
            discountAmount = applicableDiscount.value;
        }
    }
    
    const total = Math.max(0, subtotal - discountAmount);
    
    const handleCustomerDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCustomerDetails(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsProcessing(true);
        const newOrder = await onCheckout(customerDetails);
        if (newOrder) {
            showToast(`Order #${newOrder.id} created & receipt sent to customer!`, 'success');
            setIsCheckoutModalOpen(false);
            setCustomerDetails({ customerName: '', customerContact: '', customerAddress: '', customerEmail: '' });
        } else {
            // showToast is handled in checkout function
        }
        setIsProcessing(false);
    }
    
    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        const inventoryItem = inventory.find(i => i.id === itemId);
        if (inventoryItem && newQuantity > 0 && newQuantity > inventoryItem.quantity) {
            showToast(`Not enough stock for ${inventoryItem.name}. Only ${inventoryItem.quantity} available.`, 'error');
            return;
        }
        onUpdateQuantity(itemId, newQuantity);
    };

    const confirmClearCart = () => {
        onClearCart();
        setIsConfirmClearCartOpen(false);
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
                            <AuthenticatedImage src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-lg object-cover mr-4" />
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
                    <div className="flex justify-between text-gray-700"><span>Subtotal:</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                    {applicableDiscount && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount ({applicableDiscount.description}):</span>
                            <span className="font-medium">-{formatCurrency(discountAmount)}</span>
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
    const { inventory, cart, discounts, addToCart, updateCartQuantity, removeFromCart, checkout, clearCart, isLoading } = useData();
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
    
    const handleCheckout = (customerDetails: { customerName: string; customerContact: string; customerAddress: string; customerEmail: string; }): Promise<Order | null> => {
        if (user) {
            return checkout(customerDetails, user.id);
        }
        return Promise.resolve(null);
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
                <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                    <ShoppingCartIcon className="h-8 w-8 mr-3 text-brand-primary" />
                    Product Catalog
                </h1>
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
                                <AuthenticatedImage src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover rounded-t-lg -m-6 mb-0" />
                                <div className="mt-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                                    <p className="text-sm text-gray-500">{item.category}</p>
                                    {item.warrantyPeriod && (
                                        <p className="text-xs text-gray-600 mt-2 flex items-center">
                                            <ShieldCheckIcon className="h-4 w-4 mr-1 text-gray-400" />
                                            Warranty: <strong>{item.warrantyPeriod} months</strong>
                                        </p>
                                    )}
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
                </div>
                )}
            </div>
            
            <CartSidebar 
                cart={cart}
                discounts={discounts}
                onUpdateQuantity={updateCartQuantity}
                onRemove={removeFromCart}
                onCheckout={handleCheckout}
                onClearCart={clearCart}
            />
        </div>
    );
};

export default CatalogPage;