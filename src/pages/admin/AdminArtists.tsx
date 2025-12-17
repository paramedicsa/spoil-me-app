import React from 'react';
import { Tabs, Tab, Card, CardBody } from "@nextui-org/react";

const AdminArtistsPage: React.FC = () => {
  // Dummy data for artist applications - replace with real data from your backend
  const applications = [
    { id: 1, name: 'Jane Doe', tier: 'Tester', status: 'Pending' },
    { id: 2, name: 'John Smith', tier: 'Hobbyist', status: 'Pending' },
  ];

  // Dummy data for products needing pricing - replace with real data
  const productsToPrice = [
    { id: 101, artist: 'Jane Doe', requestedCost: 150, imageUrl: 'https://via.placeholder.com/150' },
    { id: 102, artist: 'John Smith', requestedCost: 200, imageUrl: 'https://via.placeholder.com/150' },
  ];

    // Dummy data for QC
    const qcItems = [
        { id: 1, orderId: 'ORD-123', artist: 'Jane Doe', status: 'Pending Inspection' },
        { id: 2, orderId: 'ORD-124', artist: 'John Smith', status: 'Pending Inspection' },
    ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Artist Hub</h1>
      <Tabs aria-label="Artist Management">
        <Tab key="applications" title="Applications">
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold mb-4">Pending Applications</h2>
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="flex justify-between items-center p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <div>
                      <p className="font-bold">{app.name}</p>
                      <p className="text-sm text-zinc-500">Wants to join as {app.tier}</p>
                    </div>
                    <div className="flex gap-4">
                      <button className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600">Approve</button>
                      <button className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Tab>
        <Tab key="pricing" title="The Pricing Room">
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold mb-4">Price New Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsToPrice.map((product) => (
                  <div key={product.id} className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
                    <img src={product.imageUrl} alt="Product" className="w-full h-48 object-cover rounded-md mb-4" />
                    <p className="font-bold mb-2">Artist: {product.artist}</p>
                    <p className="mb-4">Requested Cost: <span className="font-semibold">R{product.requestedCost}</span></p>
                    <div className="space-y-2">
                      <input type="number" placeholder="Set Selling Price (e.g., 450)" className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700" />
                      <input type="number" placeholder="Set RRP (e.g., 899)" className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                    <button className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Publish to Shop</button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Tab>
        <Tab key="qc" title="Quality Control Hub">
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold mb-4">Items for Inspection</h2>
               <div className="mb-4">
                  <input type="text" placeholder="Scan or Type Order ID" className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="space-y-4">
                {qcItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <div>
                      <p className="font-bold">Order ID: {item.orderId}</p>
                      <p className="text-sm text-zinc-500">Artist: {item.artist}</p>
                    </div>
                    <div className="flex gap-4">
                      <button className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600">PASS ✅</button>
                      <button className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600">FAIL ❌</button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default AdminArtistsPage;

