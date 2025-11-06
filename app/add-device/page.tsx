import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AddDevicePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (token) {
    // Set the device_auth cookie
    const cookieStore = await cookies();
    cookieStore.set('device_auth', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
      sameSite: 'strict',
      secure: true,
    });

    // Redirect to home page
    redirect('/');
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Add Device</h1>
      <p>No token provided. Please use the URL format:</p>
      <code>/add-device?token=YOUR_DEVICE_TOKEN</code>
    </div>
  );
}
