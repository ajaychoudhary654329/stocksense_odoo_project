const express = require('express');
const { getMoves, getMoveById } = require('../controllers/moveController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getMoves);
router.get('/:id', getMoveById);

module.exports = router;
