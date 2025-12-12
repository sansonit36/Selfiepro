import React, { ChangeEvent } from 'react';

interface ImageUploaderProps {
  label: string;
  subLabel?: string;
  onImageSelect: (files: FileList | null) => void;
  multiple?: boolean;
  previewImages?: string[]; // Array of preview URLs
  onRemove?: (index: number) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  subLabel,
  onImageSelect, 
  multiple = false,
  previewImages = [],
  onRemove
}) => {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelect(e.target.files);
      // Reset value so same file can be selected again if needed
      e.target.value = '';
    }
  };

  return (
    <div className="w-full mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      {subLabel && <p className="text-xs text-gray-500 mb-3">{subLabel}</p>}
      
      <div className="flex flex-wrap gap-4">
        {/* Upload Button Area */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-indigo-300 rounded-2xl cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <p className="text-xs text-indigo-600 font-medium">Add Photo</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              multiple={multiple}
              onChange={handleInputChange}
            />
          </label>
        </div>

        {/* Previews */}
        {previewImages.map((src, index) => (
          <div key={index} className="relative w-32 h-32 group">
            <img 
              src={src} 
              alt={`Preview ${index}`} 
              className="w-full h-full object-cover rounded-2xl shadow-sm"
            />
            {onRemove && (
              <button 
                onClick={() => onRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUploader;