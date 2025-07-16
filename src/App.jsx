import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css'; // Assuming you still have some global CSS or this is just for context

export default function App() {
  const [showHeader, setShowHeader] = useState(true);
  const [headerTransparent, setHeaderTransparent] = useState(false);
  const lastScrollY = useRef(0);
  const [activeMenu, setActiveMenu] = useState('Ideas');
  const [scrollY, setScrollY] = useState(0); // State for parallax effect
  const [posts, setPosts] = useState([]);
  const [pageNumber, setPageNumber] = useState(
    parseInt(localStorage.getItem('pageNumber')) || 1
  );
  const [pageSize, setPageSize] = useState(
    parseInt(localStorage.getItem('pageSize')) || 10
  );
  const [sortOrder, setSortOrder] = useState(
    localStorage.getItem('sortOrder') || '-published_at'
  ); // terbaru
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true); // Initial loading for the first fetch
  const [error, setError] = useState(null);
  // Removed hasMore and isFetchingMore states as infinite scroll is being removed

  // handleScroll for header visibility and parallax effect (infinite scroll detection removed)
  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;

    // Header visibility logic
    if (currentY > lastScrollY.current && currentY > 100) {
      setShowHeader(false);
    } else {
      setShowHeader(true);
    }
    setHeaderTransparent(currentY > 0);
    lastScrollY.current = currentY;

    // Parallax effect: update scrollY state
    setScrollY(currentY);

    // Infinite scroll detection removed
  }, []); // Dependencies for useCallback adjusted

  // Effect to attach and clean up scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Function to fetch posts from the API (reverted to original behavior without infinite scroll append)
  const fetchPosts = useCallback(async () => {
    setLoading(true); // Always show full skeleton on fetch
    setError(null); // Clear any previous errors

    try {
      const url = `https://suitmedia-backend.suitdev.com/api/ideas?page[number]=${pageNumber}&page[size]=${pageSize}&append[]=small_image&append[]=medium_image&sort=${sortOrder}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }

      const actualData = await response.json();
      const postsFromApi = actualData.data || [];

      // Reverted to replacing posts, not appending
      const combinedPosts = postsFromApi.length < 12
        ? [
            ...postsFromApi,
            ...Array.from({ length: Math.max(0, 12 - postsFromApi.length) }, (_, i) => ({
              id: `dummy-${pageNumber}-${pageSize}-${i}`,
              title: `Dummy Post ${i + 1}: Tips Kreatif untuk Influencer`,
              published_at: new Date(new Date().setHours(0, 0, 0, 0) - (i * 86400000)).toISOString(),
              small_image: [
                { url: `https://placehold.co/600x400/E0E0E0/888888?text=Dummy+Image+${i+1}` }
              ],
            })),
          ]
        : postsFromApi;

      setPosts(combinedPosts);
      setTotalPosts(actualData.meta?.total || combinedPosts.length); // Use combinedPosts.length for dummy fallback
    } catch (err) {
      console.error("API fetch error:", err);
      setError("Gagal memuat postingan dari API. Menampilkan dummy data.");

      const dummyPosts = Array.from({ length: pageSize }, (_, i) => ({
        id: `dummy-fallback-${pageNumber}-${i}`,
        title: `Dummy Post ${i + 1}: Judul Contoh yang Agak Panjang untuk Menguji Elipsis Tiga Baris`,
        published_at: new Date(new Date().setHours(0, 0, 0, 0) - (i * 86400000)).toISOString(),
        small_image: [
          { url: `https://placehold.co/600x400/E0E0E0/888888?text=Fallback+${i+1}` }
        ],
      }));
      setPosts(dummyPosts);
      setTotalPosts(dummyPosts.length);
    } finally {
      setLoading(false); // End loading
      // isFetchingMore state removed
    }
  }, [pageNumber, pageSize, sortOrder]); // Dependencies adjusted

  // Effect to trigger fetchPosts and save settings to localStorage
  useEffect(() => {
    fetchPosts();
    localStorage.setItem('pageNumber', pageNumber.toString());
    localStorage.setItem('pageSize', pageSize.toString());
    localStorage.setItem('sortOrder', sortOrder);
  }, [pageNumber, pageSize, sortOrder, fetchPosts]);

  // Handler for page size change
  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setPageNumber(1); // Reset to first page on size change
    // setPosts([]); // No need to clear posts, full skeleton will show
    // setHasMore(true); // No longer needed
  };

  // Handler for sort order change
  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
    setPageNumber(1); // Reset to first page on sort change
    // setPosts([]); // No need to clear posts, full skeleton will show
    // setHasMore(true); // No longer needed
  };

  // Calculate total pages (reinstated for pagination buttons)
  const totalPages = Math.ceil(totalPosts / pageSize);

  // Pagination buttons render function (reinstated)
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, pageNumber - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons && totalPages >= maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const baseBtnClasses = "px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200";
    const defaultBtnClasses = "bg-gray-200 text-gray-700 hover:bg-gray-300";
    const activeBtnClasses = "bg-orange-500 text-white hover:bg-orange-600";
    const disabledBtnClasses = "bg-gray-100 text-gray-400 cursor-not-allowed";

    // First page button
    buttons.push(
      <button
        key="first"
        onClick={() => setPageNumber(1)}
        className={`${baseBtnClasses} ${pageNumber === 1 ? disabledBtnClasses : defaultBtnClasses}`}
        disabled={pageNumber === 1}
        aria-label="First page"
      >
        &laquo;
      </button>
    );

    // Previous page button
    buttons.push(
      <button
        key="prev"
        onClick={() => setPageNumber(pageNumber - 1)}
        className={`${baseBtnClasses} ${pageNumber === 1 ? disabledBtnClasses : defaultBtnClasses}`}
        disabled={pageNumber === 1}
        aria-label="Previous page"
      >
        &lsaquo;
      </button>
    );

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setPageNumber(i)}
          className={`${baseBtnClasses} ${pageNumber === i ? activeBtnClasses : defaultBtnClasses}`}
          aria-current={pageNumber === i ? "page" : undefined}
        >
          {i}
        </button>
      );
    }

    // Next page button
    buttons.push(
      <button
        key="next"
        onClick={() => setPageNumber(pageNumber + 1)}
        className={`${baseBtnClasses} ${pageNumber === totalPages ? disabledBtnClasses : defaultBtnClasses}`}
        disabled={pageNumber === totalPages}
        aria-label="Next page"
      >
        &rsaquo;
      </button>
    );

    // Last page button
    buttons.push(
      <button
        key="last"
        onClick={() => setPageNumber(totalPages)}
        className={`${baseBtnClasses} ${pageNumber === totalPages ? disabledBtnClasses : defaultBtnClasses}`}
        disabled={pageNumber === totalPages}
        aria-label="Last page"
      >
        &raquo;
      </button>
    );

    return buttons;
  };

  return (
    <div className="font-inter antialiased text-gray-800">
      {/* Header */}
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        } ${headerTransparent ? 'bg-white bg-opacity-90 shadow-md' : 'bg-white'}`}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <img src="https://suitmedia.com/_ipx/w_200&f_webp&q_100/assets/img/site-logo.png" alt="Suitmedia Logo" className="h-8 mr-2" />
            <span className="font-bold text-lg text-orange-500 hidden sm:block">suit.media</span>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex space-x-8 items-center"> {/* Increased space-x for better separation */}
            {['Work', 'About', 'Services', 'Ideas', 'Careers', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`relative text-gray-700 hover:text-orange-500 transition-colors duration-200 font-medium
                            ${activeMenu === item ? 'text-orange-600 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-orange-600' : ''}`}
                onClick={() => setActiveMenu(item)}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Banner Hero / Ideas Section */}
      <section className="relative w-full overflow-hidden pt-16 md:pt-24">
        <div
          className="absolute inset-0 bg-cover bg-center will-change-transform transition-transform duration-75 ease-linear"
          style={{
            backgroundImage: `url(/image_7f29a8.jpg)`,
            transform: `translateY(${scrollY * 0.3}px)`, // Parallax effect
          }}
        ></div>
        {/* Overlay dan Slanted Bottom */}
        <div className="relative z-10 py-24 md:py-32 text-center text-white
                      bg-gradient-to-r from-orange-500 to-red-500 bg-opacity-80
                      before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-full before:h-20 before:bg-white before:transform before:skew-y-[-3deg] before:origin-bottom-left before:z-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">Ideas</h1>
          <p className="text-xl md:text-2xl drop-shadow-md">Where all our great things begin</p>
        </div>
      </section>

      {/* Post Grid */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="text-lg mb-4 md:mb-0">Menampilkan {posts.length} dari {totalPosts} ide</div>
          {/* Sort & Page Size Dropdown */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <div className="flex items-center justify-end md:justify-start">
              <label htmlFor="pageSize" className="text-gray-700 mr-2 whitespace-nowrap">Tampilkan per halaman:</label>
              <div className="relative">
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                >
                  {[10, 20, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end md:justify-start">
              <label htmlFor="sortBy" className="text-gray-700 mr-2 whitespace-nowrap">Urutkan berdasarkan:</label>
              <div className="relative">
                <select
                  id="sortBy"
                  value={sortOrder}
                  onChange={handleSortOrderChange}
                  className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="-published_at">Terbaru</option>
                  <option value="published_at">Terlama</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Skeleton / Posts Grid / Error Message */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: pageSize }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
                <div className="aspect-w-16 aspect-h-9 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-xl text-red-600 py-12">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-xl"
              >
                <div className="aspect-w-16 aspect-h-9 overflow-hidden">
                  <img
                    src={post.small_image?.[0]?.url || 'https://placehold.co/600x400/E0E0E0/888888?text=No+Image'}
                    alt={post.title}
                    className="w-full h-full object-cover rounded-t-lg"
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/E0E0E0/888888?text=No+Image'; }}
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-500 mb-2">{new Date(post.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <h3 className="text-lg font-semibold line-clamp-3 text-gray-900">{post.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Loading Indicator removed */}
        {/* {!hasMore && !loading && !error && posts.length > 0 && (
          <div className="text-center text-gray-500 py-4">Semua ide telah dimuat.</div>
        )} */}

        {/* Pagination buttons reinstated */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {renderPaginationButtons()}
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-6 text-center">
        <p>&copy; 2025 Suitmedia. All rights reserved.</p>
      </footer>
    </div>
  );
}
