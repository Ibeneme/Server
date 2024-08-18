const express = require('express');
const Status = require('../../models/Status');
const router = express.Router();

router.put('/status/:id', async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) {
      return res.status(404).json({ msg: 'Status not found' });
    }

    Object.assign(status, req.body);
    await status.save();

    res.json({ msg: 'Status updated', status });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
