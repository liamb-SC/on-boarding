// Shared chrome for every page: a nav bar, then the current page below it.
export default function Layout() {
  return (
    <div>
      <nav>
        {/* TODO: NavLinks to "/" (Home) and "/products" (Products) */}
      </nav>
      <main>{/* TODO: the matched child route renders here */}</main>
    </div>
  );
}
