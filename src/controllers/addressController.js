const { query } = require('../config/db');
const { apiResponse, apiError } = require('../utils/helpers');

exports.getAddresses = async (req, res) => {
  const result = await query('SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC', [req.user.id]);
  return apiResponse(res, 200, result.rows);
};

exports.createAddress = async (req, res) => {
  const { label, name, phone, line1, line2, city, state, pin, is_default } = req.body;
  if (!name || !phone || !line1 || !city || !pin) return apiError(res, 400, 'Required fields missing');

  if (is_default) await query('UPDATE addresses SET is_default=false WHERE user_id=$1', [req.user.id]);

  const result = await query(
    'INSERT INTO addresses (user_id,label,name,phone,line1,line2,city,state,pin,is_default) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
    [req.user.id, label||'Home', name, phone, line1, line2, city, state||'Odisha', pin, is_default||false]);
  return apiResponse(res, 201, result.rows[0], 'Address added');
};

exports.updateAddress = async (req, res) => {
  const { label, name, phone, line1, line2, city, state, pin, is_default } = req.body;
  if (is_default) await query('UPDATE addresses SET is_default=false WHERE user_id=$1', [req.user.id]);
  const result = await query(
    'UPDATE addresses SET label=$1,name=$2,phone=$3,line1=$4,line2=$5,city=$6,state=$7,pin=$8,is_default=$9 WHERE id=$10 AND user_id=$11 RETURNING *',
    [label, name, phone, line1, line2, city, state, pin, is_default, req.params.id, req.user.id]);
  if (!result.rows.length) return apiError(res, 404, 'Address not found');
  return apiResponse(res, 200, result.rows[0], 'Address updated');
};

exports.deleteAddress = async (req, res) => {
  await query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  return apiResponse(res, 200, null, 'Address deleted');
};
