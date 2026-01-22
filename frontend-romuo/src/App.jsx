import { useState } from 'react';
import InteractiveMap from './components/InteractiveMap';
import Sidebar from './components/Sidebar';

function App() {
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-dark-900">
      {/* Carte interactive - 70% de la largeur */}
      <div className="w-[70%] h-full relative">
        <InteractiveMap pickup={pickup} destination={destination} />
      </div>

      {/* Sidebar - 30% de la largeur */}
      <div className="w-[30%] h-full border-l border-dark-700 shadow-2xl">
        <Sidebar onPickupChange={setPickup} onDestinationChange={setDestination} />
      </div>
    </div>
  );
}

export default App;
