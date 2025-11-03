import React, { useState } from 'react';

const ImageViewer = ({ images = [], className = '', onDelete }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hmr-backend.vercel.app';

  const getFullImageUrl = (url) => {
    if (!url) return '';
    // If URL is already absolute, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Otherwise, prepend API base URL
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const openModal = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setIsModalOpen(false);
  };

  const handleDelete = (image, index) => {
    if (onDelete) {
      onDelete(image, index);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className={`text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">No images uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className={`image-viewer-grid ${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => {
            const imageUrl = typeof image === 'string' ? image : image.url;
            const imageName = typeof image === 'string' ? `Image ${index + 1}` : (image.filename || image.name || `Image ${index + 1}`);
            const fullUrl = getFullImageUrl(imageUrl);

            return (
              <div
                key={index}
                className="relative group border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div
                  className="aspect-square cursor-pointer overflow-hidden"
                  onClick={() => openModal(image)}
                >
                  <img
                    src={fullUrl}
                    alt={imageName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"%3E%3C/path%3E%3C/svg%3E';
                    }}
                  />
                </div>

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    {/* View button */}
                    <button
                      onClick={() => openModal(image)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="View full size"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    {/* Download button */}
                    <a
                      href={fullUrl}
                      download={imageName}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Download"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>

                    {/* Delete button (if onDelete is provided) */}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image, index);
                        }}
                        className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Image name */}
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" title={imageName}>
                    {imageName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-size image modal */}
      {isModalOpen && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
              title="Close"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Full-size image */}
            <img
              src={getFullImageUrl(typeof selectedImage === 'string' ? selectedImage : selectedImage.url)}
              alt={typeof selectedImage === 'string' ? 'Image' : (selectedImage.filename || selectedImage.name || 'Image')}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />

            {/* Image info */}
            {typeof selectedImage !== 'string' && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
                <p className="text-sm font-medium">{selectedImage.filename || selectedImage.name}</p>
                {selectedImage.uploadedAt && (
                  <p className="text-xs text-gray-300 mt-1">
                    Uploaded: {new Date(selectedImage.uploadedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageViewer;

