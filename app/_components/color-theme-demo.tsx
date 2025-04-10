import React from 'react';

export function ColorThemeDemo() {
  // Color categories
  const primaryColors = [
    { name: 'Yellow (Primary)', class: 'bg-heycontent-yellow', hex: '#FFDF39' },
    { name: 'Purple (Accent)', class: 'bg-heycontent-purple text-white', hex: '#9046FF' },
    { name: 'Green (Success)', class: 'bg-heycontent-green', hex: '#45E290' },
  ];

  const backgroundColors = [
    { name: 'White (Background)', class: 'bg-white border border-gray-200', hex: '#FFFFFF' },
    { name: 'Light Yellow', class: 'bg-heycontent-light-yellow', hex: 'HSL var(--light-yellow)' },
    { name: 'Light Purple', class: 'bg-heycontent-light-purple', hex: 'HSL var(--light-purple)' },
    { name: 'Light Green', class: 'bg-heycontent-light-green', hex: 'HSL var(--light-green)' },
    { name: 'Light Gray', class: 'bg-secondary', hex: 'HSL var(--secondary)' },
  ];

  const textColors = [
    { name: 'Dark Text', class: 'text-text-dark bg-white border border-gray-200', hex: 'HSL var(--dark-text)' },
    { name: 'Gray Text', class: 'text-text-gray bg-white border border-gray-200', hex: 'HSL var(--gray-text)' },
    { name: 'White Text', class: 'text-white bg-gray-800', hex: '#FFFFFF' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">HeyContent Color Palette</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Brand Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {primaryColors.map((color) => (
            <div key={color.name} className="rounded-xl overflow-hidden shadow-sm">
              <div className={`${color.class} h-24 flex items-end p-3`}>
                <span className="font-medium">{color.hex}</span>
              </div>
              <div className="p-3 bg-white">
                <p className="font-medium">{color.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Background Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {backgroundColors.map((color) => (
            <div key={color.name} className="rounded-xl overflow-hidden shadow-sm">
              <div className={`${color.class} h-16 flex items-end p-3`}>
                <span className="font-medium">{color.hex}</span>
              </div>
              <div className="p-3 bg-white">
                <p className="font-medium">{color.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Text Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {textColors.map((color) => (
            <div key={color.name} className="rounded-xl overflow-hidden shadow-sm">
              <div className={`${color.class} h-16 flex items-center justify-center`}>
                <span className="font-medium">Sample Text</span>
              </div>
              <div className="p-3 bg-white">
                <p className="font-medium">{color.name}</p>
                <p className="text-sm text-text-gray">{color.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">UI Examples</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-medium">Buttons</h3>
            <div className="space-y-2">
              <button className="bg-heycontent-yellow text-text-dark px-4 py-2 rounded-lg font-medium hover:brightness-95 transition-all">
                Primary Button
              </button>
              <button className="bg-heycontent-purple text-white px-4 py-2 rounded-lg font-medium hover:brightness-95 transition-all ml-2">
                Purple Button
              </button>
              <button className="bg-heycontent-green text-text-dark px-4 py-2 rounded-lg font-medium hover:brightness-95 transition-all ml-2">
                Success Button
              </button>
            </div>
            
            <h3 className="font-medium mt-4">Cards</h3>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <h4 className="font-semibold">Card Title</h4>
              <p className="text-text-gray text-sm mt-1">Card with white background and subtle border</p>
            </div>
            
            <div className="bg-heycontent-light-yellow rounded-xl shadow-sm p-4">
              <h4 className="font-semibold">Light Yellow Card</h4>
              <p className="text-text-gray text-sm mt-1">Card with light yellow background</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <p className="text-text-gray text-sm">Total Users</p>
                <p className="text-3xl font-bold text-text-dark">32.5K</p>
                <p className="text-heycontent-green font-medium">+12%</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <p className="text-text-gray text-sm">Engagement</p>
                <p className="text-3xl font-bold text-text-dark">8.2%</p>
                <p className="text-heycontent-green font-medium">+3.1%</p>
              </div>
            </div>
            
            <h3 className="font-medium mt-4">Badges</h3>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-heycontent-light-yellow text-text-dark px-3 py-1 rounded-full text-sm">
                Yellow Badge
              </span>
              <span className="bg-heycontent-light-purple text-heycontent-purple px-3 py-1 rounded-full text-sm">
                Purple Badge
              </span>
              <span className="bg-heycontent-light-green text-green-700 px-3 py-1 rounded-full text-sm">
                Green Badge
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 