const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const order   = require('../controllers/orderController');
const booking = require('../controllers/bookingController');
const admin   = require('../controllers/adminController');
const review  = require('../controllers/reviewController');

router.use(authMiddleware, adminMiddleware);

// Dashboard & reports
router.get('/dashboard',              admin.getDashboard);
router.get('/revenue',                admin.getRevenue);

// Orders
router.get('/orders',                 order.adminGetOrders);
router.get('/orders/:id',             order.adminGetOrder);
router.put('/orders/:id/status',      order.updateOrderStatus);

// Bookings
router.get('/bookings',               booking.adminGetBookings);
router.get('/bookings/:id',           booking.adminGetBooking);
router.put('/bookings/:id/status',    booking.updateBookingStatus);

// Customers
router.get('/customers',              admin.getCustomers);
router.get('/customers/:id',          admin.getCustomer);

// Inventory
router.get('/inventory',              admin.getInventory);
router.put('/inventory/:id',          admin.updateStock);

// Reviews
router.get('/reviews',                review.adminGetReviews);
router.put('/reviews/:id',            review.adminUpdateReview);
router.delete('/reviews/:id',         review.adminDeleteReview);

module.exports = router;
