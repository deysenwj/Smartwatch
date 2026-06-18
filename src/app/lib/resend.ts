export async function sendOtpViaResend(
  email: string,
  otp: string
): Promise<{ success: boolean; message?: string; isSimulated?: boolean }> {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  const fromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL || "Smartwatch OTP <onboarding@resend.dev>";

  // Jika API key belum diset atau memakai placeholder, gunakan simulasi
  if (!apiKey || apiKey === "re_your_api_key_here") {
    console.log(`%c[SIMULASI RESEND]%c Mengirim OTP %c${otp}%c ke email %c${email}%c.`, 
      "color: #4f46e5; font-weight: bold;", "", 
      "color: #10b981; font-weight: bold; font-size: 14px;", "", 
      "color: #3b82f6; font-weight: bold;", "");
    
    return { success: true, isSimulated: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "Smartwatch - Kode OTP Lupa Password",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-bottom: 16px;">Smartwatch Indonesia</h2>
            <p>Halo,</p>
            <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda. Gunakan kode OTP berikut untuk melanjutkan:</p>
            <div style="background-color: #f3f4f6; padding: 12px 24px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0; color: #1f2937;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.message || `HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Gagal mengirim email via Resend:", error);
    throw new Error(
      error instanceof Error ? error.message : "Gagal menghubungi API Resend."
    );
  }
}
