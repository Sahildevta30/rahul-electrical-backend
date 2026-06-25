// OTP Generator — integrates with 2Factor.in (popular in India)
// Replace sendOTP with your SMS provider

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phone, otp) => {
  // Development: just log the OTP
  if (process.env.NODE_ENV !== "production") {
    console.log(`📱 OTP for ${phone}: ${otp}`);
    return true;
  }

  // Production: use 2Factor.in (affordable for India)
  // Sign up at 2factor.in and get API key
  try {
    const response = await fetch(
      `https://2factor.in/API/V1/${process.env.OTP_API_KEY}/SMS/${phone}/${otp}/OTP1`
    );
    const data = await response.json();
    return data.Status === "Success";
  } catch (err) {
    console.error("OTP send failed:", err);
    return false;
  }
};

module.exports = { generateOTP, sendOTP };
