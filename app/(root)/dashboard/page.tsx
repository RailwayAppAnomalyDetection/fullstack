// pages/index.tsx
import Layout from '../layout';

const Home = () => {
  return (
    <Layout>
      {/* Dashboard */}
      <div className="space-y-4">
        {/* Top Boxes */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-900 h-24 rounded-md"></div>
          <div className="bg-blue-900 h-24 rounded-md"></div>
          <div className="bg-blue-900 h-24 rounded-md"></div>
        </div>

        {/* Main Panel */}
        <div className="bg-gray-300 h-96 rounded-md"></div>
      </div>
    </Layout>
  );
};

export default Home;
