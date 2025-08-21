import React, { useState } from 'react';
import { linksApi } from '../api/links';
import toast from 'react-hot-toast';
import { ClipboardDocumentIcon, LinkIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

const UrlShortener: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    try {
      const result = await linksApi.createAnonymous(url);
      setShortUrl(result.shortUrl);
      setUrl('');
      toast.success('Short URL created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create short URL');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter your long URL here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Shorten URL'}
          </button>
        </div>
      </form>

      {shortUrl && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LinkIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Your shortened URL:</p>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {shortUrl}
                </a>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-5 w-5 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-600">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlShortener;