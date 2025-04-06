import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Head from 'next/head';

interface DataPoint {
  time: number;
  population: number;
  delta: number;
}

interface AgeGroup {
  minAge: number;
  maxAge: number;
  fertilityRate: number;
  mortalityRate: number;
  color: string; // For visualization
}

interface PopulationByAge {
  age: number;
  count: number;
}

export default function Home() {
  // Simulation parameters
  const [startingPopulation, setStartingPopulation] = useState(100);
  const [replicationChance, setReplicationChance] = useState(0.1);
  const [deathChance, setDeathChance] = useState(0.05);
  const [crowdingCoefficient, setCrowdingCoefficient] = useState(0.001);
  
  // Simulation state
  const [population, setPopulation] = useState(startingPopulation);
  const [time, setTime] = useState(0);
  const [data, setData] = useState<DataPoint[]>([{ time: 0, population: startingPopulation, delta: 0 }]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Age-related state
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([
    { minAge: 0, maxAge: 5, fertilityRate: 0, mortalityRate: 0.08, color: '#4CAF50' },     // Children
    { minAge: 6, maxAge: 15, fertilityRate: 0.2, mortalityRate: 0.05, color: '#2196F3' },  // Young Adults
    { minAge: 16, maxAge: 25, fertilityRate: 0.15, mortalityRate: 0.06, color: '#9C27B0' }, // Adults
    { minAge: 26, maxAge: 40, fertilityRate: 0.05, mortalityRate: 0.1, color: '#FF9800' }   // Elderly
  ]);

  const [populationByAge, setPopulationByAge] = useState<PopulationByAge[]>([]);
  
  // Add this state for the warning popup
  const [showResetWarning, setShowResetWarning] = useState(false);
  
  // Initialize age distribution
  const initializeAgeDistribution = () => {
    const distribution: PopulationByAge[] = [];
    const maxAge = Math.max(...ageGroups.map((g: AgeGroup) => g.maxAge));
    
    // Create even distribution across ages
    for (let age = 0; age <= maxAge; age++) {
      distribution.push({
        age,
        count: Math.floor(startingPopulation / (maxAge + 1))
      });
    }
    setPopulationByAge(distribution);
  };
  
  // Reset simulation
  const resetSimulation = () => {
    // Pause the simulation first
    setIsRunning(false);
    
    // Reset all simulation values
    setPopulation(startingPopulation);
    setTime(0);
    setData([{ time: 0, population: startingPopulation, delta: 0 }]);
    
    // If we have age distribution, initialize it
    if (initializeAgeDistribution) {
      initializeAgeDistribution();
    }
  };
  
  // Initialize data on parameter change
  useEffect(() => {
    resetSimulation();
  }, [startingPopulation]);
  
  // Run simulation
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      // Calculate new population based on the correct growth model
      // Growth rate = (replicationChance - deathChance - (crowdingCoefficient * population)) * population
      
      const growthRate = replicationChance - deathChance - (crowdingCoefficient * population);
      const populationChange = growthRate * population;
      
      // Apply the change to get new population (ensuring it doesn't go below 0)
      const newPopulation = Math.max(0, Math.round(population + populationChange));
      
      const newTime = time + 1;
      const delta = newPopulation - population;
      
      // Update state
      setPopulation(newPopulation);
      setTime(newTime);
      setData(prevData => [...prevData, { 
        time: newTime, 
        population: newPopulation,
        delta: delta
      }]);
      
      if (newPopulation <= 0) {
        setIsRunning(false);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [isRunning, time, population, replicationChance, deathChance, crowdingCoefficient]);

  // Add this function to calculate carrying capacity
  const calculateCarryingCapacity = () => {
    // If replicationChance <= deathChance, population will decline to 0
    if (replicationChance <= deathChance) return 0;
    
    // Otherwise, calculate the carrying capacity
    return Math.round((replicationChance - deathChance) / crowdingCoefficient);
  };

  // Create a function to handle reset button clicks
  const handleResetClick = () => {
    if (isRunning) {
      // Show warning if simulation is running
      setShowResetWarning(true);
      
      // Auto-hide the warning after 3 seconds
      setTimeout(() => {
        setShowResetWarning(false);
      }, 3000);
    } else {
      // If not running, reset normally
      resetSimulation();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <Head>
        <title>Population Simulation</title>
        <meta name="description" content="Simple population growth simulation" />
      </Head>
      
      <main className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-8">Population Simulation</h1>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starting Population: {startingPopulation}
              </label>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={startingPopulation}
                onChange={(e) => setStartingPopulation(Number(e.target.value))}
                className="w-full"
                disabled={isRunning}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Replication Chance: {replicationChance.toFixed(3)}
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.001"
                value={replicationChance}
                onChange={(e) => setReplicationChance(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Death Chance: {deathChance.toFixed(3)}
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.001"
                value={deathChance}
                onChange={(e) => setDeathChance(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crowding Coefficient: {crowdingCoefficient.toFixed(5)}
              </label>
              <input
                type="range"
                min="0"
                max="0.01"
                step="0.0001"
                value={crowdingCoefficient}
                onChange={(e) => setCrowdingCoefficient(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Simulation Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-2 rounded-md ${
              isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            } text-white font-medium`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          
          <button
            onClick={handleResetClick}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md"
          >
            Reset
          </button>
        </div>
        
        {/* Current Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-center mb-4">Current Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Time Stat */}
            <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">Time:</span>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-blue-700">{time}</span>
                  <span className="ml-1 text-blue-500 text-sm">ticks</span>
                </div>
              </div>
              <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${Math.min(100, (time / 100) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            {/* Population Stat */}
            <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-100">
              <div className="flex items-center justify-between">
                <span className="text-purple-800 font-medium">Population:</span>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-purple-700">{population.toLocaleString()}</span>
                  <span className="ml-1 text-purple-500 text-sm">organisms</span>
                </div>
              </div>
              <div className="mt-2 h-2 bg-purple-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${Math.min(100, (population / 1000) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            {/* Delta Stat */}
            <div className="bg-green-50 p-4 rounded-lg shadow border border-green-100">
              <div className="flex items-center justify-between">
                <span className="text-green-800 font-medium">Growth Rate:</span>
                <div className="flex items-center">
                  {data.length > 1 ? (
                    <>
                      <span className={`text-2xl font-bold ${data[data.length - 1].delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data[data.length - 1].delta.toFixed(2)}
                      </span>
                      <span className="ml-1 text-green-500 text-sm">per tick</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">0.00</span>
                  )}
                </div>
              </div>
              {data.length > 1 && (
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${data[data.length - 1].delta >= 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ 
                      width: `${Math.min(100, Math.abs(data[data.length - 1].delta / 10) * 100)}%`,
                      marginLeft: data[data.length - 1].delta >= 0 ? '0' : 'auto',
                      marginRight: data[data.length - 1].delta < 0 ? '0' : 'auto'
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Carrying Capacity */}
        <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-100">
          <div className="flex items-center justify-between">
            <span className="text-yellow-800 font-medium">Carrying Capacity:</span>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-yellow-700">
                {calculateCarryingCapacity().toLocaleString()}
              </span>
              <span className="ml-1 text-yellow-500 text-sm">organisms</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Maximum sustainable population based on current parameters
          </div>
        </div>
        
        {/* Charts */}
        <div className="space-y-8">
          {/* Population vs Time Chart */}
          <div>
            <h2 className="text-xl font-semibold text-center mb-4">Population vs Time</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    label={{ value: 'Time', position: 'insideBottomRight', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Population', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="population" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                    name="Population"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Delta vs Population Chart */}
          <div>
            <h2 className="text-xl font-semibold text-center mb-4">Delta vs Population</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="population" 
                    label={{ value: 'Population', position: 'insideBottomRight', offset: -5 }}
                    type="number"
                    domain={[0, 'dataMax + 100']}
                    allowDataOverflow={true}
                    tickCount={10}
                  />
                  <YAxis 
                    label={{ value: 'Delta', angle: -90, position: 'insideLeft' }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value.toFixed(2), 'Delta']}
                    labelFormatter={(value: number) => `Population: ${value}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="delta" 
                    stroke="#82ca9d" 
                    name="Delta Growth"
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      {/* Add the popup component at the end of the main div */}
      {showResetWarning && (
        <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md animate-fade-in-up">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
            <p>Cannot reset while simulation is running. Pause first.</p>
          </div>
        </div>
      )}

      {/* Add this CSS animation class to your global styles or inline */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
} 