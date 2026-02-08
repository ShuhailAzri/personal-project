
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppStatus, ColorOption, GeneratedVersion } from './types';
import { PRESET_COLORS, APP_TITLE } from './constants';
import { processRepaint } from './services/geminiService';
import { 
  CameraIcon, 
  ArrowPathIcon, 
  PaintBrushIcon, 
  PlusIcon,
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  TrashIcon,
  EyeIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';

export default function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [customHex, setCustomHex] = useState<string>('#4f46e5');
  const [history, setHistory] = useState<GeneratedVersion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setCurrentResult(null);
        setStatus(AppStatus.IDLE);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setCustomHex(hex);
    setSelectedColor({
      id: 'custom',
      name: 'Custom Color',
      hex: hex,
      description: `Your personalized shade: ${hex}`
    });
  };

  const handleRepaint = async () => {
    if (!sourceImage || !selectedColor) return;
    
    setStatus(AppStatus.PROCESSING);
    setError(null);

    try {
      const result = await processRepaint(sourceImage, selectedColor.name, selectedColor.hex);
      setCurrentResult(result);
      
      const newVersion: GeneratedVersion = {
        id: Math.random().toString(36).substr(2, 9),
        originalImage: sourceImage,
        editedImage: result,
        colorName: selectedColor.name,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newVersion, ...prev]);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setError(err.message || "Failed to repaint the wall. Please try again.");
      setStatus(AppStatus.ERROR);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const loadFromHistory = (item: GeneratedVersion) => {
    setSourceImage(item.originalImage);
    setCurrentResult(item.editedImage);
    setStatus(AppStatus.SUCCESS);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <PaintBrushIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm text-gray-500 font-medium hidden sm:inline">Powered by Gemini 2.5 AI</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Step 1: Upload */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <h2 className="text-lg font-semibold text-gray-800">Upload Photo</h2>
              </div>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${sourceImage ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                />
                {sourceImage ? (
                  <div className="text-center">
                    <CheckCircleIcon className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Photo Uploaded</p>
                    <button className="text-xs text-indigo-600 mt-2 hover:underline">Change photo</button>
                  </div>
                ) : (
                  <div className="text-center">
                    <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-700">Click or drag to upload</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
            </section>

            {/* Step 2: Choose Color */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <h2 className="text-lg font-semibold text-gray-800">Choose Color</h2>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color)}
                    className={`group relative aspect-square rounded-lg flex items-center justify-center transition-all ${selectedColor?.id === color.id ? 'ring-2 ring-indigo-600 ring-offset-2' : 'hover:scale-105'}`}
                    title={color.name}
                  >
                    <div 
                      className="w-full h-full rounded-lg shadow-inner" 
                      style={{ backgroundColor: color.hex }}
                    />
                    {selectedColor?.id === color.id && (
                      <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center">
                        <CheckCircleIcon className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
                
                {/* Custom Color Button */}
                <button
                  onClick={() => colorInputRef.current?.click()}
                  className={`group relative aspect-square rounded-lg flex items-center justify-center transition-all border-2 border-dashed ${selectedColor?.id === 'custom' ? 'ring-2 ring-indigo-600 ring-offset-2 border-indigo-200' : 'border-gray-200 hover:border-indigo-300 hover:scale-105'}`}
                  title="Pick a custom color"
                >
                  <div 
                    className="w-full h-full rounded-lg flex items-center justify-center overflow-hidden" 
                    style={{ backgroundColor: selectedColor?.id === 'custom' ? customHex : 'transparent' }}
                  >
                    {selectedColor?.id !== 'custom' && <PlusIcon className="w-6 h-6 text-gray-400 group-hover:text-indigo-400" />}
                    {selectedColor?.id === 'custom' && <div className="absolute inset-0 bg-black/10 flex items-center justify-center"><SwatchIcon className="w-5 h-5 text-white" /></div>}
                  </div>
                  <input 
                    type="color" 
                    ref={colorInputRef} 
                    className="absolute opacity-0 pointer-events-none" 
                    value={customHex}
                    onChange={handleCustomColorChange}
                  />
                </button>
              </div>

              {selectedColor && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-8 h-8 rounded-lg shadow-sm shrink-0" style={{ backgroundColor: selectedColor.hex }} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{selectedColor.name}</p>
                    <p className="text-xs text-gray-500 truncate">{selectedColor.description}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Step 3: Action */}
            <section>
              <button
                disabled={!sourceImage || !selectedColor || status === AppStatus.PROCESSING}
                onClick={handleRepaint}
                className={`w-full py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${(!sourceImage || !selectedColor || status === AppStatus.PROCESSING) ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'}`}
              >
                {status === AppStatus.PROCESSING ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Painting your room...
                  </>
                ) : (
                  <>
                    <PaintBrushIcon className="w-5 h-5" />
                    Visualize New Paint
                  </>
                )}
              </button>
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <ExclamationCircleIcon className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </section>

            {/* History */}
            {history.length > 0 && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Palettes</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((item) => (
                    <div key={item.id} className="group relative flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                      <img src={item.editedImage} className="w-14 h-14 object-cover rounded-lg shadow-sm bg-gray-100" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.colorName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{new Date(item.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => loadFromHistory(item)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-md shadow-sm border border-transparent hover:border-gray-200"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteHistoryItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-md shadow-sm border border-transparent hover:border-gray-200"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Main Stage */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 h-full flex flex-col min-h-[600px]">
              {/* Toolbar */}
              <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${currentResult ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {currentResult ? 'Visualized' : 'Original Photo'}
                  </div>
                  {currentResult && (
                    <button 
                      onClick={() => setCurrentResult(null)}
                      className="text-xs font-semibold text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                    >
                      <ArrowPathIcon className="w-3 h-3" />
                      View Original
                    </button>
                  )}
                </div>
                {currentResult && (
                  <a 
                    href={currentResult} 
                    download={`repainted-${selectedColor?.name || 'wall'}.png`}
                    className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all active:scale-95"
                  >
                    Download Design
                  </a>
                )}
              </div>

              {/* Viewport */}
              <div className="flex-1 relative bg-gray-900 flex items-center justify-center p-6 sm:p-10">
                {sourceImage ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                      src={currentResult || sourceImage} 
                      className={`max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all duration-1000 ${status === AppStatus.PROCESSING ? 'opacity-40 grayscale blur-sm' : 'opacity-100'}`}
                      alt="Wall Preview" 
                    />
                    
                    {status === AppStatus.PROCESSING && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4 animate-in fade-in duration-500">
                         <div className="relative">
                            <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                            <PaintBrushIcon className="w-10 h-10 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
                         </div>
                         <h3 className="mt-8 text-2xl font-bold tracking-tight">Painting your room...</h3>
                         <p className="mt-3 text-indigo-200 text-sm max-w-xs leading-relaxed">Gemini AI is blending your chosen color with the natural lighting and texture of the room.</p>
                      </div>
                    )}

                    {!currentResult && status !== AppStatus.PROCESSING && (
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-xl px-5 py-2.5 rounded-full text-white text-xs font-semibold border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Select a shade to see the transformation
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center animate-in zoom-in-95 duration-500">
                    <div className="w-28 h-28 bg-gray-800/50 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                      <CameraIcon className="w-12 h-12 text-gray-500" />
                    </div>
                    <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">Ready to transform your space?</h3>
                    <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">Upload a photo of your room to see it repainted in seconds with advanced AI.</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-10 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
                    >
                      <CloudArrowUpIcon className="w-5 h-5" />
                      Upload a Photo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400 font-medium">&copy; 2024 Wall Paint AI Visualizer • Built with Gemini 2.5</p>
          <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-300">
             <span className="hover:text-gray-500 cursor-pointer transition-colors">Documentation</span>
             <span className="hover:text-gray-500 cursor-pointer transition-colors">Privacy</span>
             <span className="hover:text-gray-500 cursor-pointer transition-colors">API Status</span>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}
