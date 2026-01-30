import { Star, Phone, MessageSquare, Car } from 'lucide-react';
import { MOCK_DRIVER } from '../utils/vehicles';

export default function DriverCard({ driver = MOCK_DRIVER, onCall, onMessage }) {
  return (
    <div className="driver-card animate-fade-in">
      {/* Driver Info */}
      <div className="flex items-center gap-4">
        {/* Photo */}
        <div className="relative">
          <img
            src={driver.photo}
            alt={driver.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-swiss-md"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
        </div>

        {/* Name & Rating */}
        <div className="flex-1">
          <h3 className="font-semibold text-black text-lg">
            {driver.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-black fill-black" />
              <span className="text-sm font-medium text-black">
                {driver.rating}
              </span>
            </div>
            <span className="text-sm text-gray-400">
              {driver.trips} courses
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCall}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Phone className="w-5 h-5 text-black" />
          </button>
          <button
            type="button"
            onClick={onMessage}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-swiss bg-gray-100 flex items-center justify-center">
              <Car className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-black">
                {driver.vehicle.brand} {driver.vehicle.model}
              </p>
              <p className="text-sm text-gray-500">
                {driver.vehicle.color}
              </p>
            </div>
          </div>

          {/* Swiss Plate */}
          <div className="swiss-plate">
            <span className="text-red-600 font-bold">CH</span>
            <span>{driver.vehicle.plate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
