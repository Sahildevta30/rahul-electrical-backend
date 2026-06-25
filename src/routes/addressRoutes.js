const router = require('express').Router();
const ctrl = require('../controllers/addressController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/',       authMiddleware, ctrl.getAddresses);
router.post('/',      authMiddleware, ctrl.createAddress);
router.put('/:id',    authMiddleware, ctrl.updateAddress);
router.delete('/:id', authMiddleware, ctrl.deleteAddress);

module.exports = router;
