// The root layout wraps every page. In the app router, folders under app/
// are URL segments: app/products/page.jsx is /products.
import Link from 'next/link';

export const metadata = { title: 'Gadget shop' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui', margin: 24 }}>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <a href="/api/products">/api/products (JSON)</a>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
