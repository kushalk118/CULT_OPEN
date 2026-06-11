const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, bookingController.getAllBookings);
router.post('/', authenticateToken, bookingController.createBooking);
router.patch('/:id/status', authenticateToken, requireAdmin, bookingController.updateBookingStatus);
router.patch('/:id/issue', authenticateToken, requireAdmin, bookingController.issueBooking);
router.patch('/:id/return', authenticateToken, requireAdmin, bookingController.returnBooking);

module.exports = router;
