
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');
const { Resend } = require('resend');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

async function run() {
  const { data: users, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('checked_in', false);

  if (error) {
    console.error(error);
    return;
  }

  for (const user of users) {
    const qrData = `https://yourdomain.com/verify?id=${user.id}`;
    const qrImage = await QRCode.toDataURL(qrData);

    await resend.emails.send({
      from: 'event@yourdomain.com',
      to: user.email,
      subject: 'Your Ticket 🎟️',
      html: `
        <h2>Hello ${user.name}</h2>
        <p>Scan this at entry:</p>
        <img src="${qrImage}" />
      `
    });

    console.log(`Sent to ${user.email}`);
  }
}

run();
