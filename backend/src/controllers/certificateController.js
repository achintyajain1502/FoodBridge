const PDFDocument = require('pdfkit');
const pool = require('../config/db');

// GET /api/certificates/donation/:id
async function generateCertificate(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        d.id,
        d.food_type,
        d.quantity,
        d.unit,
        d.completed_at,
        donor.name AS donor_name,
        ngo.name AS ngo_name
       FROM donations d
       JOIN users donor ON donor.id = d.donor_id
       LEFT JOIN users ngo ON ngo.id = d.ngo_id
       WHERE d.id = $1
       AND d.status = 'completed'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Completed donation not found'
      });
    }

    const donation = result.rows[0];

    const certificateResult = await pool.query(
      `INSERT INTO certificates
       (user_id, role, certificate_type, published)
       VALUES ($1, 'donor', 'Donation Certificate', true)
       RETURNING id`,
      [req.user.id]
    );

    const certificateId = certificateResult.rows[0].id;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=FoodBridge-Certificate-${certificateId}.pdf`
    );

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    doc.pipe(res);

    doc.fontSize(28)
      .text('FoodBridge', { align: 'center' });

    doc.moveDown(2);

    doc.fontSize(24)
      .text('Certificate of Appreciation', { align: 'center' });

    doc.moveDown(2);

    doc.fontSize(16)
      .text('This certificate is proudly presented to', {
        align: 'center'
      });

    doc.moveDown();

    doc.fontSize(22)
      .text(donation.donor_name, {
        align: 'center'
      });

    doc.moveDown();

    doc.fontSize(14)
      .text(
        `for contributing ${donation.quantity} ${donation.unit} of ${donation.food_type} through FoodBridge.`,
        { align: 'center' }
      );

    doc.moveDown();

    if (donation.ngo_name) {
      doc.text(
        `The donation was successfully received by ${donation.ngo_name}.`,
        { align: 'center' }
      );
    }

    doc.moveDown(2);

    doc.fontSize(12)
      .text(
        `Donation ID: ${donation.id}`,
        { align: 'center' }
      );

    doc.text(
      `Completed on: ${new Date(donation.completed_at).toLocaleDateString()}`,
      { align: 'center' }
    );

    doc.moveDown(3);

    doc.fontSize(12)
      .text('Thank you for helping reduce food waste and support communities in need.', {
        align: 'center'
      });

    doc.moveDown(3);

    doc.fontSize(10)
      .text(`Certificate ID: ${certificateId}`, {
        align: 'center'
      });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Could not generate certificate'
    });
  }
}

module.exports = {
  generateCertificate
};