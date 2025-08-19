import React, { useState, useEffect } from 'react';
import { dropletService } from '../services/api';

const LiveDropletCosts = () => {
  const [dropletData, setDropletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedSlug, setSelectedSlug] = useState('all');
  const [excludeK8sWorkers, setExcludeK8sWorkers] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  
  useEffect(() => {
    const fetchDropletData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await dropletService.getLiveCosts();
        setDropletData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching droplet data:', error);
        setError('Failed to load droplet data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchDropletData();
    
    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [refreshCounter]);
  
  const handleRegionChange = (e) => {
    setSelectedRegion(e.target.value);
  };
  
  const handleTagChange = (e) => {
    setSelectedTag(e.target.value);
  };
  
  const handleSlugChange = (e) => {
    setSelectedSlug(e.target.value);
  };
  
  const handleExcludeK8sWorkersChange = (e) => {
    setExcludeK8sWorkers(e.target.checked);
  };
  
  const handleManualRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const getSortedDroplets = (droplets) => {
    if (!sortField) return droplets;
    
    return [...droplets].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'rate':
          aValue = a.hourly_price;
          bValue = b.hourly_price;
          break;
        case 'projectedCost':
          aValue = a.projected_cost;
          bValue = b.projected_cost;
          break;
        case 'fullMonthCost':
          aValue = a.full_month_cost;
          bValue = b.full_month_cost;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };
  
  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  const getFilteredDroplets = () => {
    if (!dropletData || !dropletData.droplets) return [];
    
    let filtered = dropletData.droplets;
    
    // Apply region filter
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(droplet => droplet.region === selectedRegion);
    }
    
    // Apply tag filter
    if (selectedTag !== 'all') {
      filtered = filtered.filter(droplet => 
        droplet.tags && 
        droplet.tags.includes(selectedTag)
      );
    }
    
    // Apply slug filter
    if (selectedSlug !== 'all') {
      filtered = filtered.filter(droplet => droplet.size === selectedSlug);
    }
    
    // Exclude DOKS worker nodes if option is enabled
    if (excludeK8sWorkers) {
      filtered = filtered.filter(droplet => 
        !droplet.tags || !droplet.tags.includes('k8s:worker')
      );
    }
    
    return filtered;
  };
  
  const getRegionOptions = () => {
    if (!dropletData || !dropletData.regionSummary) return [];
    
    return Object.entries(dropletData.regionSummary).map(([regionSlug, data]) => ({
      slug: regionSlug,
      name: data.regionName,
      count: data.count,
      cost: data.totalCost,
      fullMonthCost: data.fullMonthCost
    }));
  };
  
  const getTagOptions = () => {
    if (!dropletData || !dropletData.tagSummary) return [];
    
    return Object.entries(dropletData.tagSummary).map(([tag, data]) => ({
      name: tag,
      count: data.count,
      cost: data.totalCost,
      fullMonthCost: data.fullMonthCost
    }));
  };
  
  const getSlugOptions = () => {
    if (!dropletData || !dropletData.droplets) return [];
    
    const slugCounts = {};
    const slugCosts = {};
    const slugFullMonthCosts = {};
    
    dropletData.droplets.forEach(droplet => {
      if (!slugCounts[droplet.size]) {
        slugCounts[droplet.size] = 0;
        slugCosts[droplet.size] = 0;
        slugFullMonthCosts[droplet.size] = 0;
      }
      slugCounts[droplet.size]++;
      slugCosts[droplet.size] += droplet.projected_cost;
      slugFullMonthCosts[droplet.size] += droplet.full_month_cost;
    });
    
    return Object.entries(slugCounts).map(([slug, count]) => ({
      slug: slug,
      count: count,
      cost: slugCosts[slug],
      fullMonthCost: slugFullMonthCosts[slug]
    }));
  };
  
  const getK8sWorkerCount = () => {
    if (!dropletData || !dropletData.droplets) return 0;
    
    return dropletData.droplets.filter(droplet => 
      droplet.tags && droplet.tags.includes('k8s:worker')
    ).length;
  };
  
  const getK8sWorkerCost = () => {
    if (!dropletData || !dropletData.droplets) return 0;
    
    return dropletData.droplets
      .filter(droplet => droplet.tags && droplet.tags.includes('k8s:worker'))
      .reduce((sum, droplet) => sum + droplet.projected_cost, 0);
  };

  const getK8sWorkerFullMonthCost = () => {
    if (!dropletData || !dropletData.droplets) return 0;
    
    return dropletData.droplets
      .filter(droplet => droplet.tags && droplet.tags.includes('k8s:worker'))
      .reduce((sum, droplet) => sum + droplet.full_month_cost, 0);
  };
  
  const filteredDroplets = getSortedDroplets(getFilteredDroplets());
  const regionOptions = getRegionOptions();
  const tagOptions = getTagOptions();
  const slugOptions = getSlugOptions();
  const filteredCost = filteredDroplets.reduce((sum, droplet) => sum + droplet.projected_cost, 0);
  const filteredFullMonthCost = filteredDroplets.reduce((sum, droplet) => sum + droplet.full_month_cost, 0);
  const k8sWorkerCount = getK8sWorkerCount();
  const k8sWorkerCost = getK8sWorkerCost();
  const k8sWorkerFullMonthCost = getK8sWorkerFullMonthCost();
  
  // Tooltip components
  const Tooltip = ({ children, tooltip, wide, position = 'top' }) => (
    <div className="relative flex items-center group">
      {children}
      <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100] ${wide ? 'w-[19rem]' : 'w-64'}`}>
        {tooltip}
      </div>
    </div>
  );
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Live Droplet Costs</h2>
        <button
          onClick={handleManualRefresh}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : dropletData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700 mb-1">Total Droplets</p>
              <p className="text-2xl font-bold text-blue-900">
                {dropletData.count}
                {excludeK8sWorkers && k8sWorkerCount > 0 && (
                  <span className="text-sm font-normal ml-2">
                    (excl. {k8sWorkerCount} DOKS workers)
                  </span>
                )}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <Tooltip tooltip="Cost projected for the remainder of the current month based on hourly rates, accounting for droplet creation dates." wide={true}>
                <p className="text-sm text-green-700 mb-1 cursor-help">
                  Total Projected Cost <span className="text-xs">ⓘ</span>
                </p>
              </Tooltip>
              <p className="text-2xl font-bold text-green-900">
                {excludeK8sWorkers 
                  ? formatCurrency(dropletData.totalCost - k8sWorkerCost)
                  : formatCurrency(dropletData.totalCost)}
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <Tooltip tooltip="Cost if all droplets were to run for a full month (672 hours) at their hourly rates, which is how DigitalOcean caps monthly billing." wide={true}>
                <p className="text-sm text-indigo-700 mb-1 cursor-help">
                  Full Month Cost <span className="text-xs">ⓘ</span>
                </p>
              </Tooltip>
              <p className="text-2xl font-bold text-indigo-900">
                {excludeK8sWorkers 
                  ? formatCurrency(dropletData.totalFullMonthCost - k8sWorkerFullMonthCost)
                  : formatCurrency(dropletData.totalFullMonthCost)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-700 mb-1">Filtered Cost</p>
              <p className="text-2xl font-bold text-purple-900">
                {selectedRegion === 'all' && selectedTag === 'all' && selectedSlug === 'all' && !excludeK8sWorkers
                  ? "-"
                  : formatCurrency(filteredCost)}
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <input
                id="exclude-k8s-workers"
                type="checkbox"
                checked={excludeK8sWorkers}
                onChange={handleExcludeK8sWorkersChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="exclude-k8s-workers" className="ml-2 block text-sm text-gray-900">
                Exclude DOKS worker nodes ({k8sWorkerCount} nodes, {formatCurrency(k8sWorkerCost)})
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="region-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Region
                </label>
                <select
                  id="region-select"
                  value={selectedRegion}
                  onChange={handleRegionChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Regions</option>
                  {regionOptions.map((region) => (
                    <option key={region.slug} value={region.slug}>
                      {region.name} ({region.count} droplets - {formatCurrency(region.cost)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="tag-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Tag
                </label>
                <select
                  id="tag-select"
                  value={selectedTag}
                  onChange={handleTagChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Tags</option>
                  {tagOptions.map((tag) => (
                    <option key={tag.name} value={tag.name}>
                      {tag.name} ({tag.count} droplets - {formatCurrency(tag.cost)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="slug-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Slug
                </label>
                <select
                  id="slug-select"
                  value={selectedSlug}
                  onChange={handleSlugChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Slugs</option>
                  {slugOptions.map((slug) => (
                    <option key={slug.slug} value={slug.slug}>
                      {slug.slug} ({slug.count} droplets - {formatCurrency(slug.cost)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Name</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Region</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Tags</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    <Tooltip tooltip={<>Droplet size slug. <a href="https://slugs.do-api.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">View all slugs info</a></>} position="bottom">
                      <span className="cursor-help">Slug <span className="text-xs">ⓘ</span></span>
                    </Tooltip>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Created</th>
                  <th 
                    scope="col" 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('rate')}
                  >
                    <div className="flex items-center">
                      Rate
                      <SortIcon field="rate" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('projectedCost')}
                  >
                    <div className="flex items-center">
                      Projected Cost
                      <SortIcon field="projectedCost" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('fullMonthCost')}
                  >
                    <div className="flex items-center">
                      Full Month Cost
                      <SortIcon field="fullMonthCost" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDroplets.map((droplet) => (
                  <tr key={droplet.id}>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900 truncate max-w-xs">{droplet.name}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{droplet.regionName}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {droplet.tags && droplet.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {droplet.tags.map(tag => {
                            // Check if tag is a k8s UUID tag
                            const isK8sUuidTag = tag.match(/^k8s:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
                            
                            if (isK8sUuidTag) {
                              // Truncate the UUID part
                              const shortTag = tag.substring(0, 8) + '...';
                              return (
                                <Tooltip key={tag} tooltip={tag} wide={true}>
                                  <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 cursor-help">
                                    {shortTag}
                                  </span>
                                </Tooltip>
                              );
                            }
                            
                            return (
                              <span key={tag} className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {droplet.size}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {new Date(droplet.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {formatCurrency(droplet.hourly_price)}/hr
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900">
                      {formatCurrency(droplet.projected_cost)}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900">
                      {formatCurrency(droplet.full_month_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-right text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No droplet data available.</p>
        </div>
      )}
    </div>
  );
};

export default LiveDropletCosts; 