import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import './CertificateMap.css';

// Fix Leaflet default icon issue
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CertificateMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const markersRef = useRef([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedDegree, setSelectedDegree] = useState('all');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Fetch real certificates from the backend
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/certificates', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch certificates');
        }

        const data = await response.json();
        setCertificates(data);
        setFilteredCertificates(data);
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      if (!map.current) {
        map.current = L.map(mapContainer.current).setView([20, 0], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map.current);

        // Add a scale control
        L.control.scale().addTo(map.current);
      }
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
    } finally {
      setIsLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Filter certificates based on search and filters
  useEffect(() => {
    let results = [...certificates];
    
    if (searchTerm) {
      results = results.filter(cert => 
        cert.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.university_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.degree_program.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificate_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCountry !== 'all') {
      results = results.filter(cert => cert.country === selectedCountry);
    }

    if (selectedDegree !== 'all') {
      results = results.filter(cert => cert.degree_program === selectedDegree);
    }

    if (selectedUniversity !== 'all') {
      results = results.filter(cert => cert.university_name === selectedUniversity);
    }

    setFilteredCertificates(results);
  }, [searchTerm, selectedCountry, selectedDegree, selectedUniversity, certificates]);

  // Update markers when filtered certificates change
  useEffect(() => {
    if (!map.current || filteredCertificates.length === 0) {
      // Clear existing markers if no results
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create bounds object
    const bounds = L.latLngBounds([]);

    filteredCertificates.forEach(certificate => {
      let lat, lng;
      
      // If coordinates are missing, generate random ones near the country's general area
      if (!certificate.latitude || !certificate.longitude) {
        // Fallback coordinates based on country or random
        const countryCoordinates = {
          'USA': { lat: 39.8283, lng: -98.5795 },
          'UK': { lat: 54.7024, lng: -3.2766 },
          'Japan': { lat: 36.2048, lng: 138.2529 },
          'Switzerland': { lat: 46.8182, lng: 8.2275 },
          'South Korea': { lat: 35.9078, lng: 127.7669 },
          'Canada': { lat: 56.1304, lng: -106.3468 },
          'France': { lat: 46.2276, lng: 2.2137 },
          'China': { lat: 35.8617, lng: 104.1954 },
          'Australia': { lat: -25.2744, lng: 133.7751 },
          'Brazil': { lat: -14.2350, lng: -51.9253 }
        };
        
        if (certificate.country && countryCoordinates[certificate.country]) {
          const coords = countryCoordinates[certificate.country];
          // Add some randomness within the country
          lat = coords.lat + (Math.random() * 10 - 5);
          lng = coords.lng + (Math.random() * 10 - 5);
        } else {
          // Fallback to random worldwide coordinates
          lat = Math.random() * 180 - 90;
          lng = Math.random() * 360 - 180;
        }
      } else {
        lat = parseFloat(certificate.latitude);
        lng = parseFloat(certificate.longitude);
      }

      // Create a custom icon with animation class
      const customIcon = L.divIcon({
        className: `certificate-marker ${selectedMarker === certificate.id ? 'active' : ''}`,
        html: `<div class="marker-content">${certificate.student_name.charAt(0)}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map.current)
        .bindPopup(`
          <div class="popup-content">
            <h3>${certificate.student_name}</h3>
            <div class="popup-grid">
              <div class="popup-column">
                <p><span class="popup-label">Certificate ID:</span> ${certificate.certificate_id}</p>
                <p><span class="popup-label">University:</span> ${certificate.university_name}</p>
                <p><span class="popup-label">Degree:</span> ${certificate.degree_program}</p>
                <p><span class="popup-label">Major:</span> ${certificate.major}</p>
              </div>
              <div class="popup-column">
                <p><span class="popup-label">Graduation:</span> ${certificate.graduation_date}</p>
                <p><span class="popup-label">CGPA:</span> ${certificate.cgpa}</p>
                <p><span class="popup-label">Status:</span> ${certificate.status}</p>
                <p><span class="popup-label">Location:</span> ${certificate.city}, ${certificate.country}</p>
              </div>
            </div>
            <div class="popup-footer">
              <p><span class="popup-label">Verifications:</span> ${certificate.verification_count}</p>
            </div>
          </div>
        `);

      // Add hover effects
      marker.on('mouseover', () => {
        setSelectedMarker(certificate.id);
        marker.setIcon(L.divIcon({
          className: 'certificate-marker active',
          html: `<div class="marker-content">${certificate.student_name.charAt(0)}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        }));
        marker.openPopup();
      });

      marker.on('mouseout', (e) => {
        // Check if the mouse is not over the popup
        const popup = e.target.getPopup();
        const popupElement = popup.getElement();
        if (!popupElement.contains(e.originalEvent.relatedTarget)) {
          setSelectedMarker(null);
          marker.setIcon(L.divIcon({
            className: 'certificate-marker',
            html: `<div class="marker-content">${certificate.student_name.charAt(0)}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
          }));
          marker.closePopup();
        }
      });

      // Add popup mouseenter/mouseleave events
      marker.getPopup().on('mouseenter', () => {
        setSelectedMarker(certificate.id);
      });

      marker.getPopup().on('mouseleave', () => {
        setSelectedMarker(null);
        marker.closePopup();
      });

      markersRef.current.push(marker);
      bounds.extend([lat, lng]);
    });

    // Fit bounds if we have markers
    if (markersRef.current.length > 0) {
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [filteredCertificates, selectedMarker]);

  // Get unique countries, degrees, and universities for filters
  const countries = [...new Set(certificates.map(c => c.country))];
  const degrees = [...new Set(certificates.map(c => c.degree_program))];
  const universities = [...new Set(certificates.map(c => c.university_name))];

  return (
    <div className="map-container-wrapper">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading map...</p>
        </div>
      )}
      {error && (
        <div className="error-overlay">
          <p>Error: {error}</p>
        </div>
      )}
      
      {/* Map Controls */}
      <div className="map-controls">
        <h3>Certificate Explorer</h3>
        
        <input
          type="text"
          placeholder="Search certificates..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <div className="filters">
          <select 
            value={selectedCountry} 
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            <option value="all">All Countries</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          
          <select 
            value={selectedDegree} 
            onChange={(e) => setSelectedDegree(e.target.value)}
          >
            <option value="all">All Degrees</option>
            {degrees.map(degree => (
              <option key={degree} value={degree}>{degree}</option>
            ))}
          </select>
          
          <select 
            value={selectedUniversity} 
            onChange={(e) => setSelectedUniversity(e.target.value)}
          >
            <option value="all">All Universities</option>
            {universities.map(university => (
              <option key={university} value={university}>{university}</option>
            ))}
          </select>
        </div>
        
        <div className="results-count">
          Showing {filteredCertificates.length} of {certificates.length} certificates
        </div>
      </div>
      
      <div 
        ref={mapContainer} 
        className="map-container"
      />
      
      {filteredCertificates.length === 0 && certificates.length > 0 && (
        <div className="no-results">
          <p>No certificates match your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default CertificateMap;