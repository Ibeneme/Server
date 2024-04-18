const express = require('express');
const Withdrawal = require('../../models/Providers/Withdrawal');
const Status = require('../../models/Providers/Status');
const router = express.Router();

router.get('/withdrawals', async (req, res) => {
  const userId = req.user._id;

  try {
    // Find withdrawals for the authenticated user
    const withdrawals = await Withdrawal.find({ userId }).sort({ time: -1 });

    // Count the amount for all withdrawals with status "approved"
    const approvedWithdrawals = withdrawals.filter(withdrawal => withdrawal.status === 'approved');
    const totalApprovedAmount = approvedWithdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);

    // Calculate charges for all approved withdrawals (2% of the amount)
    const charges = approvedWithdrawals.map(withdrawal => ({ 
      requestId: withdrawal.requestId,
      charge: withdrawal.amount * 0.02  // Calculate 2% charge
    }));

    // Find items with status "accepted" for the authenticated user
    const items = await Status.find({ subscriberId: userId, status: 'accepted' }).sort({ createdAt: -1 });
    const totalAcceptedAmount = items.reduce((total, item) => total + item.price, 0);

    // Calculate the balance as the difference between total accepted amount and total approved amount
    const balance = totalAcceptedAmount - totalApprovedAmount;

    res.status(200).json({ withdrawals, totalApprovedAmount, totalAcceptedAmount, balance, charges });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// POST route to add a withdrawal
router.get('/getall', async (req, res) => {
    try {
      // Find all withdrawals
      const withdrawals = await Withdrawal.find();
  
      res.status(200).json({ withdrawals });
    } catch (error) {
      console.error('Error fetching all withdrawals:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
router.get('/approved', async (req, res) => {
    try {
        // Extract user ID from the token
        const userId = req.user._id;
    
        // Find all withdrawals with status as "approved" for the authenticated user
        const withdrawals = await Withdrawal.find({ userId, status: 'approved' });
    
        res.status(200).json({ withdrawals });
      } catch (error) {
        console.error('Error fetching approved withdrawals:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
  });
router.put('/:withdrawalId', async (req, res) => {
    const { status } = req.body;
    const withdrawalId = req.params.withdrawalId;
  
    try {
      // Find the withdrawal by ID
      const withdrawal = await Withdrawal.findById(withdrawalId);
  
      if (!withdrawal) {
        return res.status(404).json({ message: 'Withdrawal not found' });
      }
  
      // Update the status
      withdrawal.status = status;
  
      // Save the updated withdrawal
      await withdrawal.save();
  
      res.status(200).json({ message: 'Withdrawal status updated successfully', withdrawal });
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


router.post('/withdrawals', async (req, res) => {
  const {  amount, recipientAddress } = req.body;
  const userId = req.user._id;
  try {
    // Create a new withdrawal instance
    const withdrawal = new Withdrawal({
      userId,
      amount,
      recipientAddress,
      // The default status will be "pending"
    });

    // Save the new withdrawal
    await withdrawal.save();

    res.status(201).json({ message: 'Withdrawal added successfully', withdrawal });
  } catch (error) {
    console.error('Error adding withdrawal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;