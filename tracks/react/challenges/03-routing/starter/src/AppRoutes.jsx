import Layout from './Layout.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Products from './pages/Products.jsx';

// The route table. Every page is rendered inside <Layout> (the nav bar).
//   /               -> Home
//   /products       -> Products
//   /products/:id   -> ProductDetail
//   anything else   -> NotFound
export default function AppRoutes() {
  // TODO: <Routes> with a layout route and nested child routes
  return <Home />;
}
