/* ═══════════════════════════════════════════════════════════
   PointBreak Rides Fiji — App Logic (Leaflet + OpenStreetMap)
   ═══════════════════════════════════════════════════════════ */

const API_BASE = '';
const FIJI_CENTER = [-17.8, 177.9];
const FIJI_ZOOM = 8;
const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/* ── Pull to Refresh ── */
(function initPullRefresh() {
  let startY = 0, pulling = false, threshold = 80;
  const el = document.getElementById('pull-refresh');
  const text = el?.querySelector('span');
  if (!el) return;

  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0 && document.getElementById('app') && !document.getElementById('app').classList.contains('hidden')) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0 && dy < 150) {
      el.style.height = Math.min(dy, 70) + 'px';
      el.classList.add('active');
      text.textContent = dy >= threshold ? 'Release to refresh' : 'Pull to refresh';
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!pulling) return;
    pulling = false;
    const h = parseInt(el.style.height) || 0;
    if (h >= threshold) {
      el.classList.add('refreshing');
      el.style.height = '70px';
      text.textContent = 'Refreshing...';
      setTimeout(() => {
        location.reload();
      }, 800);
    } else {
      el.classList.remove('active');
      el.style.height = '0px';
    }
  });
})();

const HOTEL_INFO = {
  'nadi-airport': { desc: 'Nadi International Airport (NAN) — Fiji\'s main international gateway handling 90% of international flights. Located 10km north of Nadi town.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Nadi_International_Airport.jpg/640px-Nadi_International_Airport.jpg', stars: '', type: 'Airport' },
  'nadi-town': { desc: 'Nadi Town Centre — The commercial hub of Nadi with shops, restaurants, and the famous Sri Siva Subramaniya Temple nearby.', img: '', stars: '', type: 'Town' },
  'nadi-market': { desc: 'Nadi Municipal Market — Fresh produce, tropical fruits, kava roots, and authentic Fijian street food.', img: '', stars: '', type: 'Market' },
  'novotel-nadi': { desc: 'Novotel Nadi — 4-star hotel in the heart of Nadi with modern rooms, pool, and restaurant. Popular with business and leisure travellers.', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', stars: '★★★★', type: 'Hotel' },
  'tanoa-intl': { desc: 'Tanoa International Hotel — 4-star hotel near Nadi Airport with tropical gardens, pool, and full-service restaurant.', img: '', stars: '★★★★', type: 'Hotel' },
  'raffles-gateway': { desc: 'Raffles Gateway Hotel — Budget-friendly hotel minutes from Nadi Airport. Ideal for early morning departures.', img: '', stars: '★★★', type: 'Hotel' },
  'fiji-gateway': { desc: 'Fiji Gateway Hotel — Comfortable accommodation near the airport with Fijian hospitality.', img: '', stars: '★★★', type: 'Hotel' },
  'crowne-nadi': { desc: 'Crowne Plaza Fiji Nadi Bay — 5-star beachfront resort with infinity pool, spa, and waterfront dining.', img: '', stars: '★★★★★', type: 'Resort' },
  'club-fiji': { desc: 'Club Fiji Resort — Beachfront resort on Wailoaloa Beach with private beach, water sports, and beachside dining.', img: '', stars: '★★★★', type: 'Resort' },
  'wyndham-wailoaloa': { desc: 'Wyndham Garden Wailoaloa Beach — Modern beachfront hotel with restaurant, pool, and ocean views.', img: '', stars: '★★★★', type: 'Hotel' },
  'ramada-wailoaloa': { desc: 'Ramada Suites Wailoaloa — Beachfront suites with kitchen facilities, pool, and direct beach access.', img: '', stars: '★★★★', type: 'Hotel' },
  'tokatoka': { desc: 'Tokatoka Resort Hotel — Boutique resort in Nadi with traditional Fijian bure accommodation and lush tropical gardens.', img: '', stars: '★★★', type: 'Resort' },
  'denarau-marina': { desc: 'Denarau Marina — Gateway to the Mamanuca Islands. Home to water taxis, boat charters, and island transfer services.', img: '', stars: '', type: 'Marina' },
  'port-denarau': { desc: 'Port Denarau — Upscale shopping and dining precinct with waterfront restaurants, boutiques, and tour operators.', img: '', stars: '', type: 'Shopping' },
  'hilton-denarau': { desc: 'Hilton Fiji Beach Resort & Spa — 5-star beachfront resort with 7 pools, kids club, spa, and 6 restaurants. One of Fiji\'s largest resorts.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hilton_Fiji_Beach_Resort_and_Spa.jpg/640px-Hilton_Fiji_Beach_Resort_and_Spa.jpg', stars: '★★★★★', type: 'Resort' },
  'sofitel-denarau': { desc: 'Sofitel Fiji Resort & Spa — 5-star luxury French-polynesian resort with private beach, spa, and fine dining.', img: '', stars: '★★★★★', type: 'Resort' },
  'radisson-denarau': { desc: 'Radisson Blu Resort Fiji — 5-star family resort with pool slides, kids club, and beachfront location.', img: '', stars: '★★★★★', type: 'Resort' },
  'westin-denarau': { desc: 'The Westin Denarau Island Resort — 5-star wellness resort with Heavenly Bed, spa, and beachfront dining.', img: '', stars: '★★★★★', type: 'Resort' },
  'sheraton-denarau': { desc: 'Sheraton Fiji Golf & Beach Resort — 5-star resort with 18-hole golf course, 6 pools, and private beach.', img: '', stars: '★★★★★', type: 'Resort' },
  'sheraton-villas': { desc: 'Sheraton Denarau Villas — Private villa accommodation with full kitchen, pool access, and resort facilities.', img: '', stars: '★★★★★', type: 'Villa' },
  'palms-denarau': { desc: 'The Palms Denarau — Luxury apartments with ocean views, private balconies, and resort amenities.', img: '', stars: '★★★★', type: 'Apartment' },
  'denarau-golf': { desc: 'Denarau Golf & Racquet Club — 18-hole championship golf course designed by Robert Trent Jones Jr.', img: '', stars: '', type: 'Golf' },
  'hard-rock-denarau': { desc: 'Hard Rock Cafe Denarau — Live music, cocktails, and American-Fijian fusion cuisine at Port Denarau.', img: '', stars: '', type: 'Restaurant' },
  'sonaisali': { desc: 'DoubleTree by Hilton Sonaisali — Beachfront resort on Sonaisali Island with private beach, spa, and water sports.', img: '', stars: '★★★★', type: 'Resort' },
  'fiji-marina-momi': { desc: 'Fiji Marriott Resort Momi Bay — 5-star overwater bungalow resort with infinity pool, spa, and Fijian dining.', img: '', stars: '★★★★★', type: 'Resort' },
  'first-landing': { desc: 'First Landing Beach Resort — Budget beachfront resort with traditional bure accommodation and kava ceremony.', img: '', stars: '★★★', type: 'Resort' },
  'vuda-point': { desc: 'Vuda Point Marina — Scenic marina with restaurants, dive shops, and boat charters.', img: '', stars: '', type: 'Marina' },
  'momi-battery': { desc: 'Momi Battery Historic Park — WWII gun emplacement with panoramic views of Momi Bay.', img: '', stars: '', type: 'Historic' },
  'nadi-bay': { desc: 'Nadi Bay Beach — Popular local beach with calm waters, perfect for swimming and snorkelling.', img: '', stars: '', type: 'Beach' },
  'suva-city': { desc: 'Suva City Centre — Fiji\'s capital city with colonial architecture, museums, and vibrant markets.', img: '', stars: '', type: 'City' },
  'suva-harbour': { desc: 'Suva Harbour — Scenic waterfront with fishing boats, cargo ships, and oceanfront walkway.', img: '', stars: '', type: 'Harbour' },
  'nausori-airport': { desc: 'Nausori Airport — Domestic airport serving Fiji\'s internal flights and Vanua Levu.', img: '', stars: '', type: 'Airport' },
  'grand-pacific': { desc: 'Grand Pacific Hotel — Historic 5-star hotel built in 1914. Colonial-era luxury with waterfront location and heritage architecture.', img: '', stars: '★★★★★', type: 'Hotel' },
  'holiday-inn-suva': { desc: 'Holiday Inn Suva — 4-star hotel in the heart of Suva with ocean views and modern amenities.', img: '', stars: '★★★★', type: 'Hotel' },
  'tanoa-plaza-suva': { desc: 'Tanoa Plaza Hotel — Central Suva hotel with restaurant, bar, and rooftop views.', img: '', stars: '★★★', type: 'Hotel' },
  'novotel-suva': { desc: 'Novotel Suva — Modern 4-star hotel with harbour views, pool, and conference facilities.', img: '', stars: '★★★★', type: 'Hotel' },
  'five-princes': { desc: 'Five Princes Hotel — Boutique hotel near the Parliamentary Complex with traditional Fijian hospitality.', img: '', stars: '★★★', type: 'Hotel' },
  'usp': { desc: 'University of the South Pacific — Regional university serving 12 Pacific Island countries. Beautiful campus with tropical gardens.', img: '', stars: '', type: 'University' },
  'fnu': { desc: 'Fiji National University — Technical and vocational education with campuses across Fiji.', img: '', stars: '', type: 'University' },
  'suva-market': { desc: 'Suva Municipal Market — Fiji\'s largest indoor market with fresh produce, handicrafts, and traditional Fijian food.', img: '', stars: '', type: 'Market' },
  'fiji-parliament': { desc: 'Fiji Parliament — Democratic seat of government with beautiful grounds and Pacific architecture.', img: '', stars: '', type: 'Government' },
  'tappoo-suva': { desc: 'Tappoo City Suva — Major department store with electronics, fashion, and duty-free shopping.', img: '', stars: '', type: 'Shopping' },
  'jacks-suva': { desc: 'Jack\'s of Fiji Suva — Popular local retail chain with clothing, homewares, and gifts.', img: '', stars: '', type: 'Shopping' },
  'courts-suva': { desc: 'Courts Suva — Furniture and electronics retailer with home delivery services.', img: '', stars: '', type: 'Shopping' },
  'damodar-city': { desc: 'Damodar City Suva — Modern shopping complex with cinema, restaurants, and retail stores.', img: '', stars: '', type: 'Shopping' },
  'mhcc-suva': { desc: 'MHCC (Myers Housing & Construction Complex) — Shopping and commercial centre in central Suva.', img: '', stars: '', type: 'Shopping' },
  'newworld-suva': { desc: 'Newworld Suva — Premium supermarket with imported goods and fresh produce.', img: '', stars: '', type: 'Supermarket' },
  'foodcity-suva': { desc: 'Foodcity Suva — Budget-friendly supermarket with local and imported groceries.', img: '', stars: '', type: 'Supermarket' },
  'fresh-choice-suva': { desc: 'Fresh Choice Suva — Fresh produce supermarket with deli and bakery section.', img: '', stars: '', type: 'Supermarket' },
  'bsp-suva': { desc: 'BSP Bank Suva — Bank of the South Pacific — Fiji\'s largest commercial bank.', img: '', stars: '', type: 'Bank' },
  'anz-suva': { desc: 'ANZ Bank Suva — Australia and New Zealand Banking Group — Major financial services.', img: '', stars: '', type: 'Bank' },
  'westpac-suva': { desc: 'Westpac Bank Suva — Westpac Banking Corporation — Full-service banking.', img: '', stars: '', type: 'Bank' },
  'cwm-hospital': { desc: 'CWM Hospital — Colonial War Memorial Hospital — Fiji\'s main public hospital and medical training centre.', img: '', stars: '', type: 'Hospital' },
  'suva-council': { desc: 'Suva City Council — Municipal government headquarters in the heart of Suva.', img: '', stars: '', type: 'Government' },
  'governmnet-bldg': { desc: 'Government Buildings Suva — Colonial-era government offices housing key ministries.', img: '', stars: '', type: 'Government' },
  'toberua': { desc: 'Toberua Island Resort — Private island resort in Lami Bay with traditional bure and snorkelling.', img: '', stars: '★★★', type: 'Resort' },
  'rainforest-eco': { desc: 'Rainforest Eco Lodge — Eco-friendly accommodation in the Viti Levu highlands with nature walks and waterfalls.', img: '', stars: '★★★', type: 'Lodge' },
  'lautoka-city': { desc: 'Lautoka City — Fiji\'s "Sugar City" with sugar mill, botanical gardens, and friendly local atmosphere.', img: '', stars: '', type: 'City' },
  'lautoka-sugar': { desc: 'Lautoka Sugar Mill — Historic sugar processing plant operating since 1903.', img: '', stars: '', type: 'Industrial' },
  'lautoka-market': { desc: 'Lautoka Municipal Market — Fresh produce market with local fruits, vegetables, and handicrafts.', img: '', stars: '', type: 'Market' },
  'tappoo-lautoka': { desc: 'Tappoo City Lautoka — Shopping complex with retail stores and restaurants.', img: '', stars: '', type: 'Shopping' },
  'jacks-lautoka': { desc: 'Jack\'s of Fiji Lautoka — Local retail chain with clothing and homewares.', img: '', stars: '', type: 'Shopping' },
  'lautoka-hospital': { desc: 'Lautoka Hospital — Major hospital serving the Western Division.', img: '', stars: '', type: 'Hospital' },
  'ba-town': { desc: 'Ba Town Centre — Small town known for Indian culture, temples, and friendly locals.', img: '', stars: '', type: 'Town' },
  'tavua': { desc: 'Tavua Town — Mining town at the foot of Tavua Caldera with gold mining history.', img: '', stars: '', type: 'Town' },
  'rakiraki': { desc: 'Rakiraki Town — Scenic coastal town near the Ra Province with beautiful beaches.', img: '', stars: '', type: 'Town' },
  'volivoli': { desc: 'Volivoli Beach Resort — Dive resort on the northern tip of Viti Levu with world-class diving.', img: '', stars: '★★★', type: 'Resort' },
  'wananavu': { desc: 'Wananavu Beach Resort — Boutique beachfront resort with private beach and traditional Fijian dining.', img: '', stars: '★★★★', type: 'Resort' },
  'sigatoka-town': { desc: 'Sigatoka Town — "Salad Bowl of Fiji" — Gateway to the Coral Coast with river safaris and markets.', img: '', stars: '', type: 'Town' },
  'sigatoka-market': { desc: 'Sigatoka Market — Fresh produce market with tropical fruits and vegetables.', img: '', stars: '', type: 'Market' },
  'sigatoka-river': { desc: 'Sigatoka River Safari — Jet boat adventure through the Sigatoka Valley visiting traditional Fijian villages.', img: '', stars: '', type: 'Activity' },
  'coral-coast-main': { desc: 'Coral Coast — 80km stretch of stunning coastline with luxury resorts, beaches, and snorkelling.', img: '', stars: '', type: 'Region' },
  'pacific-harbour': { desc: 'Pacific Harbour — "Adventure Capital of Fiji" with shark diving, white water rafting, and arts village.', img: '', stars: '', type: 'Town' },
  'intercon-coral': { desc: 'InterContinental Fiji Golf Resort & Spa — 5-star beachfront resort with 18-hole golf course and spa.', img: '', stars: '★★★★★', type: 'Resort' },
  'outrigger': { desc: 'Outrigger Fiji Beach Resort — 5-star beachfront resort with kids club, spa, and Fijian cultural activities.', img: '', stars: '★★★★★', type: 'Resort' },
  'naviti-resort': { desc: 'The Naviti Resort — 4-star beachfront resort with multiple pools, restaurants, and water sports.', img: '', stars: '★★★★', type: 'Resort' },
  'warwick-fiji': { desc: 'Warwick Fiji Resort & Spa — 5-star beachfront resort with infinity pool, spa, and sunset dining.', img: '', stars: '★★★★★', type: 'Resort' },
  'yatule': { desc: 'Yatule Resort & Spa — 4-star beachfront resort at Natadola Beach with surfing and horse riding.', img: '', stars: '★★★★', type: 'Resort' },
  'fiji-hideaway': { desc: 'Fiji Hideaway Resort & Spa — 3-star beachfront resort with affordable Fijian hospitality.', img: '', stars: '★★★', type: 'Resort' },
  'tambua-sands': { desc: 'Tambua Sands Beach Resort — Budget beachfront resort with traditional bure and beach activities.', img: '', stars: '★★★', type: 'Resort' },
  'natadola': { desc: 'Natadola Beach — One of Fiji\'s best beaches with golden sand, surfing, and horse riding.', img: '', stars: '', type: 'Beach' },
  'nanuku': { desc: 'Nanuku Resort Fiji — Luxury private resort with beachfront villas and world-class dining.', img: '', stars: '★★★★★', type: 'Resort' },
  'coral-coast-ss': { desc: 'Coral Coast Service Station — Refuelling and convenience store on the Queen\'s Highway.', img: '', stars: '', type: 'Service' },
  'mamanucas': { desc: 'Mamanuca Islands — Volcanic archipelago of 20 islands with crystal-clear lagoons, white sand beaches, and world-class resorts.', img: '', stars: '', type: 'Region' },
  'yanuca': { desc: 'Shangri-La Yanuca Island — 5-star private island resort with private beach, spa, and 4 restaurants.', img: '', stars: '★★★★★', type: 'Resort' },
  'malolo': { desc: 'Malolo Island Resort — 4-star eco-resort on the largest Mamanuca island with traditional bure and snorkelling.', img: '', stars: '★★★★', type: 'Resort' },
  'tokoriki': { desc: 'Tokoriki Island Resort — Adults-only luxury island resort with private villas and sunset cocktails.', img: '', stars: '★★★★★', type: 'Resort' },
  'mana-island': { desc: 'Mana Island Resort & Spa — 4-star island resort with 2 beaches, 3 pools, and Fijian village experience.', img: '', stars: '★★★★', type: 'Resort' },
  'matamanoa': { desc: 'Matamanoa Island Resort — Adults-only intimate island resort with just 12 villas.', img: '', stars: '★★★★★', type: 'Resort' },
  'tadrai': { desc: 'Tadrai Island Resort — Ultra-luxury adults-only resort with 5 private beachfront villas.', img: '', stars: '★★★★★', type: 'Resort' },
  'vomo': { desc: 'Vomo Island Fiji — 5-star private island resort with beachfront villas and luxury amenities.', img: '', stars: '★★★★★', type: 'Resort' },
  'castaway': { desc: 'Castaway Island Fiji — 4-star family island resort with 66 bure and 2 private beaches.', img: '', stars: '★★★★', type: 'Resort' },
  'lomani': { desc: 'Lomani Island Resort — Adults-only luxury island resort with just 8 suites.', img: '', stars: '★★★★★', type: 'Resort' },
  'likuliku': { desc: 'Likuliku Lagoon Resort — Fiji\'s first and only overwater bure resort. Adults-only luxury.', img: '', stars: '★★★★★', type: 'Resort' },
  'plantation-island': { desc: 'Plantation Island Resort — Family-friendly island resort with kids club and water sports.', img: '', stars: '★★★', type: 'Resort' },
  'musket-cove': { desc: 'Musket Cove Island Resort — 4-star island resort with yacht club and island dining.', img: '', stars: '★★★★', type: 'Resort' },
  'beachcomber': { desc: 'Beachcomber Island Resort — Iconic party island with beach bar, diving, and water sports.', img: '', stars: '★★★', type: 'Resort' },
  'treasure-island': { desc: 'Treasure Island Resort — Family island resort with treasure hunts, snorkelling, and kids activities.', img: '', stars: '★★★', type: 'Resort' },
  'tropica': { desc: 'Tropica Island Resort — Eco-friendly island resort with solar power and organic gardens.', img: '', stars: '★★★', type: 'Resort' },
  'six-senses': { desc: 'Six Senses Fiji — Ultra-luxury 5-star eco-resort on Qalito Island with overwater villas, spa, and sustainability programs.', img: '', stars: '★★★★★', type: 'Resort' },
  'sheraton-tokoriki': { desc: 'Sheraton Resort Tokoriki Island — 5-star island resort with beachfront rooms and Fijian cultural activities.', img: '', stars: '★★★★★', type: 'Resort' },
  'turtle-island': { desc: 'Turtle Island Fiji — Exclusive luxury island resort (filmed "The Blue Lagoon"). Just 14 private beachfront bures.', img: '', stars: '★★★★★', type: 'Resort' },
  'tavarua': { desc: 'Tavarua Island Resort — Surfing paradise with world-class left and right hand breaks.', img: '', stars: '★★★', type: 'Resort' },
  'como-laucala': { desc: 'COMO Laucala Island — Ultra-exclusive 5-star private island with 25 villas and private airstrip. Forbes 5-star.', img: '', stars: '★★★★★', type: 'Resort' },
  'wakaya': { desc: 'The Wakaya Club & Spa — Private island resort with luxury villas and all-inclusive dining.', img: '', stars: '★★★★★', type: 'Resort' },
  'yasawa': { desc: 'Yasawa Islands — Chain of 20 volcanic islands with dramatic cliffs, caves, and pristine beaches.', img: '', stars: '', type: 'Region' },
  'blue-lagoon': { desc: 'Blue Lagoon Beach Resort — Budget island resort with stunning lagoon views and snorkelling.', img: '', stars: '★★★', type: 'Resort' },
  'octopus-resort': { desc: 'Octopus Resort — Family-friendly island resort with beachfront bures and kids activities.', img: '', stars: '★★★', type: 'Resort' },
  'yasawa-resort': { desc: 'Yasawa Island Resort & Spa — Luxury island resort with just 11 beachfront bures and private beaches.', img: '', stars: '★★★★★', type: 'Resort' },
  'barefoot-kuata': { desc: 'Barefoot Kuata Island Resort — Budget island resort with shark diving and nature walks.', img: '', stars: '★★★', type: 'Resort' },
  'waya-island': { desc: 'Waya Island Resort — Remote island resort with traditional Fijian accommodation.', img: '', stars: '★★★', type: 'Resort' },
  'mantaray': { desc: 'Mantaray Island Resort — Eco-resort with manta ray snorkelling and cave exploration.', img: '', stars: '★★★', type: 'Resort' },
  'nanuya': { desc: 'Nanuya Island Resort — Boutique island resort with private beach and diving.', img: '', stars: '★★★', type: 'Resort' },
  'navutu-stars': { desc: 'Navutu Stars Resort — Intimate island resort with just 9 villas and coral reef snorkelling.', img: '', stars: '★★★★', type: 'Resort' },
  'paradise-cove': { desc: 'Paradise Cove Resort — Beachfront resort with traditional bure and kava ceremonies.', img: '', stars: '★★★', type: 'Resort' },
  'coconut-beach': { desc: 'Coconut Beach Resort — Budget beachfront resort with coconut palm views.', img: '', stars: '★★★', type: 'Resort' },
  'naqalia': { desc: 'Naqalia Lodge — Traditional Fijian lodge with village cultural experiences.', img: '', stars: '★★★', type: 'Lodge' },
  'viwa-island': { desc: 'Viwa Island Resort — Private island resort with just 12 beachfront bures.', img: '', stars: '★★★★', type: 'Resort' },
  'oarsmans': { desc: 'Oarsman\'s Bay Lodge — Budget-friendly lodge near Nacula Island with snorkelling.', img: '', stars: '★★', type: 'Lodge' },
  'labasa': { desc: 'Labasa Town — Main town on Vanua Levu with sugar mill and multicultural community.', img: '', stars: '', type: 'Town' },
  'savusavu-town': { desc: 'Savusavu Town — "Hidden Paradise" of Fiji with hot springs, diving, and yachting.', img: '', stars: '', type: 'Town' },
  'jm-cousteau': { desc: 'Jean-Michel Cousteau Resort — 5-star eco-resort with world-class diving and sustainability programs.', img: '', stars: '★★★★★', type: 'Resort' },
  'namale': { desc: 'Namale Resort & Spa — Tony Robbins-owned luxury resort with private pool villas and spa.', img: '', stars: '★★★★★', type: 'Resort' },
  'copra-sheds': { desc: 'Copra Sheds Lodge & Marina — Boutique lodge with private marina and diving.', img: '', stars: '★★★', type: 'Lodge' },
  'hotsprings': { desc: 'Savusavu Hot Springs Hotel — Hotel near natural hot springs with geothermal pools.', img: '', stars: '★★★', type: 'Hotel' },
  'koro-sun': { desc: 'Koro Sun Resort & Spa — 4-star resort with private beach, spa, and water sports.', img: '', stars: '★★★★', type: 'Resort' },
  'daku-fiji': { desc: 'Daku Fiji Resort — Boutique beachfront resort with traditional bure and kava ceremonies.', img: '', stars: '★★★', type: 'Resort' },
  'viani-bay': { desc: 'Viani Bay Resort — Remote bay resort near Rainbow Reef with world-class diving.', img: '', stars: '★★★', type: 'Resort' },
  'remote-resort': { desc: 'The Remote Resort Fiji Islands — Ultra-luxury private island resort with overwater villas.', img: '', stars: '★★★★★', type: 'Resort' },
  'nukubati': { desc: 'Nukubati Island Resort — Private island with just 7 beachfront villas and all-inclusive dining.', img: '', stars: '★★★★', type: 'Resort' },
  'vatuvara': { desc: 'Vatuvara Private Islands — Ultra-exclusive 3-island private resort. Forbes 5-star.', img: '', stars: '★★★★★', type: 'Resort' },
  'taveuni-island': { desc: 'Taveuni Island — "Garden Island of Fiji" with lush rainforests, waterfalls, and the International Date Line.', img: '', stars: '', type: 'Island' },
  'matangi': { desc: 'Matangi Private Island Resort — Horseshoe-shaped private island resort with treehouse bures and diving.', img: '', stars: '★★★★', type: 'Resort' },
  'qamea': { desc: 'Qamea Resort & Spa — Luxury island resort with private beach and spa treatments.', img: '', stars: '★★★★★', type: 'Resort' },
  'taveuni-palms': { desc: 'Taveuni Palms Resort — Ultra-luxury private resort with just 2 beachfront villas and personal chef.', img: '', stars: '★★★★★', type: 'Resort' },
  'paradise-taveuni': { desc: 'Paradise Taveuni — Boutique resort with traditional bure and island excursions.', img: '', stars: '★★★', type: 'Resort' },
  'bouma-park': { desc: 'Bouma National Heritage Park — Protected rainforest with waterfalls, hiking trails, and traditional villages.', img: '', stars: '', type: 'Park' },
  'tides-reach': { desc: 'Tides Reach Resort — Beachfront resort with ocean views and snorkelling.', img: '', stars: '★★★', type: 'Resort' },
  'the-pointe': { desc: 'The Pointe Taveuni — Modern beachfront accommodation with stunning sunset views.', img: '', stars: '★★★', type: 'Resort' },
  'dolphin-bay': { desc: 'Dolphin Bay Divers Retreat — Dive resort with dolphin watching and Rainbow Reef diving.', img: '', stars: '★★★', type: 'Resort' },
  'aroha': { desc: 'Aroha Taveuni — Budget-friendly accommodation with local island experience.', img: '', stars: '★★', type: 'Lodge' },
  'kadavu-island': { desc: 'Kadavu Island — Fiji\'s fourth largest island with untouched coral reefs and traditional villages.', img: '', stars: '', type: 'Island' },
  'matava': { desc: 'Matava Eco Resort — Award-winning eco-resort with treehouse accommodation and manta ray diving.', img: '', stars: '★★★★', type: 'Resort' },
  'kadavu-beach': { desc: 'Kadavu Beach Resort — Beachfront resort with traditional Fijian bure and snorkelling.', img: '', stars: '★★★', type: 'Resort' },
  'on-island': { desc: 'Ono Island Resort — Remote island resort with pristine coral reefs.', img: '', stars: '★★★', type: 'Resort' },
  'beqa-lagoon': { desc: 'Beqa Lagoon — World-famous shark diving destination with 8 species of sharks.', img: '', stars: '', type: 'Lagoon' },
  'beqa-lagoon-resort': { desc: 'Beqa Lagoon Resort — Beachfront resort with shark diving and snorkelling.', img: '', stars: '★★★', type: 'Resort' },
  'lalati': { desc: 'Lalati Resort & Spa — Boutique beachfront resort with spa and water sports.', img: '', stars: '★★★★', type: 'Resort' },
  'waidroka': { desc: 'Waidroka Bay Resort — Dive resort with Beqa Lagoon access and jungle hikes.', img: '', stars: '★★★', type: 'Resort' },
  'royal-davui': { desc: 'Royal Davui Island Resort — Adults-only luxury island resort with private pool villas.', img: '', stars: '★★★★★', type: 'Resort' },
  'savasi': { desc: 'Savasi Island Resort — Private island with cave exploration and snorkelling.', img: '', stars: '★★★', type: 'Resort' },
  'levuka': { desc: 'Levuka Historic Town — UNESCO World Heritage Site — Fiji\'s first capital with colonial architecture.', img: '', stars: '', type: 'Historic' },
  'ovalau': { desc: 'Ovalau Island — Historic island with Levuka town and lush interior.', img: '', stars: '', type: 'Island' },
  'cwm-hospital': { desc: 'Colonial War Memorial Hospital — Fiji\'s main public hospital.', img: '', stars: '', type: 'Hospital' },
  'suva-council': { desc: 'Suva City Council — Municipal government headquarters.', img: '', stars: '', type: 'Government' },
  'governmnet-bldg': { desc: 'Government Buildings — Colonial-era offices housing key ministries.', img: '', stars: '', type: 'Government' },
  'damodar-city-nadi': { desc: 'Damodar City Nadi — New $80M mixed-use development with shopping, dining, and entertainment.', img: '', stars: '', type: 'Development' },
  'racecourse-hotel-ba': { desc: 'Racecourse Hotels & Apartments Ba — New $25M hotel and apartment complex in Ba.', img: '', stars: '★★★★', type: 'Hotel' },
  'innovation-hub': { desc: 'Fiji Innovation Hub — RBF Suva — Technology and business innovation centre.', img: '', stars: '', type: 'Innovation' },
  'skills-hub': { desc: 'Pacific Australia Skills Hub — Walu Bay — Vocational training and skills development centre.', img: '', stars: '', type: 'Education' },
  'sim-centre': { desc: 'Healthcare Simulation Centre — US$9.8M medical training facility.', img: '', stars: '', type: 'Healthcare' },
  'damodar-city-labasa': { desc: 'Damodar City Labasa — New $60M mixed-use development on Vanua Levu.', img: '', stars: '', type: 'Development' },
  'nadi-hospital': { desc: 'Nadi Hospital — Main hospital serving the Nadi and Lautoka regions.', img: '', stars: '', type: 'Hospital' },
  'tappoo-city-nadi': { desc: 'Tappoo City Nadi — Major department store with electronics, fashion, and duty-free.', img: '', stars: '', type: 'Shopping' },
  'jacks-nadi': { desc: 'Jack\'s of Fiji Nadi — Popular local retail chain.', img: '', stars: '', type: 'Shopping' },
  'prouds-nadi': { desc: 'Prouds Duty Free Nadi — Premium duty-free shopping.', img: '', stars: '', type: 'Shopping' },
  'mcdonalds-nadi': { desc: 'McDonald\'s Nadi — Fast food restaurant near Nadi town.', img: '', stars: '', type: 'Restaurant' },
  'burger-king-nadi': { desc: 'Burger King Nadi — Fast food restaurant in central Nadi.', img: '', stars: '', type: 'Restaurant' },
  'bsp-nadi': { desc: 'BSP Bank Nadi — Bank of the South Pacific.', img: '', stars: '', type: 'Bank' },
  'anz-nadi': { desc: 'ANZ Bank Nadi — Australia and New Zealand Banking Group.', img: '', stars: '', type: 'Bank' },
  'westpac-nadi': { desc: 'Westpac Bank Nadi — Westpac Banking Corporation.', img: '', stars: '', type: 'Bank' },
  'baroda-nadi': { desc: 'Bank of Baroda Nadi — Indian-origin bank serving Fiji.', img: '', stars: '', type: 'Bank' },
  'fiji-airlines-hq': { desc: 'Fiji Airways Head Office — Corporate headquarters of Fiji\'s national airline.', img: '', stars: '', type: 'Corporate' },
  'lautoka-hospital': { desc: 'Lautoka Hospital — Major hospital serving Western Division.', img: '', stars: '', type: 'Hospital' },
  'bsp-lautoka': { desc: 'BSP Bank Lautoka — Bank of the South Pacific branch.', img: '', stars: '', type: 'Bank' },
  'tappoo-lautoka': { desc: 'Tappoo City Lautoka — Shopping complex.', img: '', stars: '', type: 'Shopping' },
  'jacks-lautoka': { desc: 'Jack\'s of Fiji Lautoka — Retail store.', img: '', stars: '', type: 'Shopping' },
};

function createMap(elId, center, zoom) {
  const map = L.map(elId, { zoomControl: true, attributionControl: false }).setView(center || FIJI_CENTER, zoom || FIJI_ZOOM);
  L.tileLayer(OSM_TILE, { maxZoom: 19 }).addTo(map);
  return map;
}

function addMarker(map, lat, lng, iconHtml, opts = {}) {
  const icon = L.divIcon({ className: opts.className || '', html: iconHtml, iconSize: opts.iconSize || [30, 30], iconAnchor: opts.iconAnchor || [15, 15] });
  const m = L.marker([lat, lng], { icon, zIndexOffset: opts.zIndex || 0 }).addTo(map);
  if (opts.popup) m.bindPopup(opts.popup);
  return m;
}

function addPolyline(map, coords, opts = {}) {
  return L.polyline(coords, { color: opts.color || '#00e5cc', weight: opts.weight || 4, opacity: opts.opacity || 0.7, dashArray: opts.dash ? '10, 12' : null }).addTo(map);
}

function addCircle(map, lat, lng, opts = {}) {
  return L.circle([lat, lng], { radius: opts.radius || 50, fillColor: opts.fillColor || '#00e5cc', fillOpacity: opts.fillOpacity || 0.08, color: opts.color || '#00e5cc', opacity: opts.opacity || 0.3, weight: opts.weight || 1 }).addTo(map);
}

function fitMapBounds(map, points, pad) {
  const bounds = L.latLngBounds(points);
  map.fitBounds(bounds, { padding: [pad || 50, pad || 50] });
}

function removeMapObject(obj) {
  if (obj && obj.remove) obj.remove();
}

function clearMapObjects(arr) {
  if (!arr) return;
  arr.forEach(obj => { if (obj && obj.remove) obj.remove(); });
}

// ═══════════ STATE ═══════════
const state = {
  user: null, token: null, mode: 'land',
  pickup: null, dropoff: null, selectedVehicle: null,
  estimate: null, currentRide: null, driverProfile: null,
  locations: [], vehicles: {},
  maps: {}, markers: {}, overlays: {},
  polling: null,
};

// ═══════════ INIT ═══════════
document.addEventListener('DOMContentLoaded', () => {
  initCountry();
  setTimeout(() => {
    document.getElementById('splash').classList.remove('active');
    document.getElementById('splash').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      const saved = loadSession();
      if (saved) { state.user = saved.user; state.token = saved.token; showApp(); }
      else showScreen('auth-screen');
    }, 800);
  }, 3000);
  loadLocations();
  loadVehicles();
});

// ═══════════ API HELPERS ═══════════
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers: { ...headers, ...opts.headers } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e) { console.error(`API ${path}:`, e.message); throw e; }
}

// ═══════════ SESSION ═══════════
function saveSession(user, token) { localStorage.setItem('pb_session', JSON.stringify({ user, token })); }
function loadSession() { try { return JSON.parse(localStorage.getItem('pb_session')); } catch { return null; } }
function clearSession() { localStorage.removeItem('pb_session'); }

// ═══════════ SCREEN NAV ═══════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function showApp() {
  showScreen('app');
  document.getElementById('app').classList.remove('hidden');
  updateUserUI();
  showSection('home');
  autoDetectRiderLocation();
  requestNotificationPermission();
  loadUserSettings();
  loadUserNotifications();
}

// ═══════════ AUTO GPS TRACKING ═══════════
let watchId = null, riderAccuracy = null;

function autoDetectRiderLocation() {
  if (!navigator.geolocation) return;
  const display = document.getElementById('pickup-display');
  display.textContent = '\uD83D\uDCE1 Detecting your location...';
  display.classList.remove('placeholder');
  navigator.geolocation.getCurrentPosition(
    (pos) => onRiderPosition(pos),
    () => { display.textContent = 'Where are you?'; display.classList.add('placeholder'); },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = navigator.geolocation.watchPosition(
    (pos) => onRiderPosition(pos), () => {},
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
  );
}

function onRiderPosition(pos) {
  const { latitude: lat, longitude: lng, accuracy } = pos.coords;
  riderAccuracy = accuracy;
  let best = null, bestDist = Infinity;
  state.locations.forEach(loc => {
    const d = haversine(lat, lng, loc.lat, loc.lng);
    if (d < bestDist) { bestDist = d; best = loc; }
  });
  const isNearKnown = best && bestDist < 5;
  state.pickup = {
    id: isNearKnown ? best.id : 'gps-rider',
    name: isNearKnown ? best.name : `Your Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    lat, lng,
    zone: isNearKnown ? best.zone : 'custom',
    modes: isNearKnown ? best.modes : ['land', 'sea'],
    icon: isNearKnown ? best.icon : '\uD83D\uDCCD',
  };
  state.myLat = lat; state.myLng = lng;
  const display = document.getElementById('pickup-display');
  display.textContent = isNearKnown
    ? `${state.pickup.icon} ${state.pickup.name} \u2705 \u00B1${Math.round(accuracy)}m`
    : `\uD83D\uDCCD ${lat.toFixed(5)}, ${lng.toFixed(5)} \u2705 \u00B1${Math.round(accuracy)}m`;
  display.classList.remove('placeholder');
  updateMapMarkers('main');
  updateMyLocationMarker(lat, lng, accuracy);
  if (state.pickup && state.dropoff) getEstimate();
}

let myLocationMarker = null, myAccuracyCircle = null;

function updateMyLocationMarker(lat, lng, accuracy) {
  const map = state.maps.main;
  if (!map) return;
  if (myLocationMarker) { myLocationMarker.remove(); myLocationMarker = null; }
  if (myAccuracyCircle) { myAccuracyCircle.remove(); myAccuracyCircle = null; }
  myAccuracyCircle = addCircle(map, lat, lng, { radius: accuracy || 50 });
  myLocationMarker = addMarker(map, lat, lng,
    '<div style="position:relative;width:28px;height:28px;"><div style="position:absolute;inset:0;border-radius:50%;background:rgba(0,229,204,0.25);animation:myLocPulse 2s ease-in-out infinite;"></div><div style="position:absolute;top:5px;left:5px;width:18px;height:18px;border-radius:50%;background:#00e5cc;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div></div>',
    { className: 'my-location-marker', iconSize: [28, 28], iconAnchor: [14, 14], popup: `<b>\uD83D\uDCCD You are here</b><small><br>Phone: ${state.user?.phone || 'N/A'}<br>Accuracy: \u00B1${Math.round(accuracy)}m</small>`, zIndex: 1000 }
  );
}

function updateUserUI() {
  if (!state.user) return;
  document.getElementById('sidebar-name').textContent = state.user.name || 'Guest';
  document.getElementById('sidebar-phone').textContent = state.user.phone || '';
  document.getElementById('sidebar-avatar').textContent = (state.user.name || 'U')[0].toUpperCase();
}

// ═══════════ AUTH ═══════════
function showAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.auth-tab:${tab === 'login' ? 'first-child' : 'last-child'}`).classList.add('active');
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
}

let signupRole = 'rider';
function selectRole(role) {
  signupRole = role;
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`.role-card[data-role="${role}"]`).classList.add('active');
}

function openDriverApplication() {
  document.getElementById('signup-form').classList.add('hidden');
  document.getElementById('driver-app-form').classList.remove('hidden');
}
function closeDriverApplication() {
  document.getElementById('driver-app-form').classList.add('hidden');
  document.getElementById('signup-form').classList.remove('hidden');
}

async function submitDriverApplication() {
  const fields = {
    name: document.getElementById('da-name').value,
    phone: `+679${document.getElementById('da-phone').value.replace(/\s/g, '')}`,
    email: document.getElementById('da-email').value || undefined,
    dob: document.getElementById('da-dob').value,
    address: document.getElementById('da-address').value,
    mode: document.getElementById('da-mode').value,
    vehicle_type: document.getElementById('da-vehicle-type').value,
    vehicle_make: document.getElementById('da-make').value,
    vehicle_model: document.getElementById('da-model').value,
    vehicle_year: parseInt(document.getElementById('da-year').value) || null,
    vehicle_color: document.getElementById('da-color').value,
    vehicle_plate: document.getElementById('da-plate').value,
    license_no: document.getElementById('da-license').value,
    license_expiry: document.getElementById('da-license-expiry').value,
    insurance_provider: document.getElementById('da-insurance-provider').value,
    insurance_policy: document.getElementById('da-insurance-policy').value,
    insurance_expiry: document.getElementById('da-insurance-expiry').value,
  };
  if (!fields.name || !fields.phone || !fields.vehicle_plate || !fields.license_no) {
    alert('Please fill in all required fields'); return;
  }
  try {
    await api('/api/driver-applications', { method: 'POST', body: JSON.stringify(fields) });
    alert('Application submitted! Admin will review it. You\'ll be notified once approved.');
    closeDriverApplication();
  } catch (err) { alert('Error: ' + err.message); }
}

async function handleLogin(e) {
  e.preventDefault();
  const phone = `+679${document.getElementById('login-phone').value.replace(/\s/g, '')}`;
  const password = document.getElementById('login-password').value || undefined;
  try {
    const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone, ...(password ? { password } : {}) }) });
    state.user = data.user; state.token = data.accessToken || data.token;
    saveSession(data.user, state.token); showApp();
  } catch (err) { alert('Login failed: ' + err.message); }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const phone = `+679${document.getElementById('signup-phone').value.replace(/\s/g, '')}`;
  const email = document.getElementById('signup-email').value || undefined;
  const home_zone = document.getElementById('signup-home-zone').value || undefined;
  const home_address = document.getElementById('signup-home-addr').value || undefined;
  const work_address = document.getElementById('signup-work').value || undefined;
  const fav_location_id = document.getElementById('signup-fav-loc').value || undefined;
  try {
    const data = await api('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name, phone, email, role: signupRole, home_zone, home_address, work_address, fav_location_id }) });
    state.user = data.user; state.token = data.accessToken || data.token;
    saveSession(data.user, state.token); showApp();
  } catch (err) { alert('Signup failed: ' + err.message); }
}

async function demoLogin(role) {
  const phone = role === 'driver' ? '+6799990002' : '+6799990001';
  try {
    const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone }) });
    state.user = data.user; state.token = data.accessToken || data.token;
    saveSession(data.user, state.token); showApp();
    if (role === 'driver') loadDriverProfile();
  } catch (err) { alert('Demo login failed: ' + err.message); }
}

function handleLogout() {
  state.user = null; state.token = null; state.currentRide = null;
  clearSession(); toggleSidebar(); showScreen('auth-screen');
}

// ═══════════ SIDEBAR ═══════════
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('active');
}

// ═══════════ SECTIONS ═══════════
function showSection(section) {
  document.querySelectorAll('.app-section').forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
  const el = document.getElementById(`section-${section}`);
  if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[onclick*="${section}"]`);
  if (navItem) navItem.classList.add('active');
  toggleSidebar();
  if (section === 'home') initMainMap();
  if (section === 'history') loadHistory();
  if (section === 'wallet') loadWallet();
  if (section === 'locations') renderLocations();
  if (section === 'guide') initGuide();
  if (section === 'driver-home') initDriverHome();
}

// ═══════════ LOCATIONS ═══════════
async function loadLocations() { try { state.locations = await api('/api/locations'); } catch { state.locations = []; } }
async function loadVehicles() { try { state.vehicles = await api('/api/vehicles'); } catch { state.vehicles = {}; } }

function renderLocations() {
  document.getElementById('locations-grid').innerHTML = state.locations.map(loc => `
    <div class="location-card" onclick="selectLocationCard('${loc.id}')">
      <div class="loc-card-icon">${loc.icon}</div>
      <div class="loc-card-name">${loc.name}</div>
      <div class="loc-card-zone">${loc.zone}</div>
      <div class="loc-card-coords">${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}</div>
      <div class="loc-card-modes">
        ${loc.modes.includes('land') ? '<span class="mode-tag land">\uD83D\uDE97 Land</span>' : ''}
        ${loc.modes.includes('sea') ? '<span class="mode-tag sea">\uD83D\uDEA4 Sea</span>' : ''}
      </div>
      <div class="loc-card-actions" onclick="event.stopPropagation()">
        <button onclick="openDestinationReviews('${loc.id}','${loc.name.replace(/'/g,"\\'")}')" style="font-size:.7rem;padding:3px 8px;border-radius:6px;background:rgba(255,193,7,0.12);color:#ffc107;border:none;cursor:pointer;font-family:inherit">⭐ Reviews</button>
        <button onclick="viewLocationSocial('${loc.id}')" style="font-size:.7rem;padding:3px 8px;border-radius:6px;background:rgba(0,180,216,0.12);color:var(--accent);border:none;cursor:pointer;font-family:inherit">📸 Stories</button>
      </div>
    </div>`).join('');
}

function selectLocationCard(locId) {
  const loc = state.locations.find(l => l.id === locId);
  if (!loc) return;
  if (!state.pickup) setPickup(loc);
  else if (!state.dropoff) setDropoff(loc);
  else { setPickup(loc); state.dropoff = null; updateLocationDisplay(); }
  showSection('home');
}
function viewLocationSocial(locId) {
  openSocial();
  setTimeout(() => {
    api(`/api/posts?location_id=${locId}`).then(posts => {
      const el = document.getElementById('social-feed-list');
      if (!el) return;
      if (!posts.length) { el.innerHTML = '<div class="empty-state"><p>No stories yet for this destination. Be the first to share!</p></div>'; return; }
      el.innerHTML = posts.map(p => {
        const photos = JSON.parse(p.photos || '[]');
        const stars = p.rating ? '⭐'.repeat(p.rating) : '';
        return `<div class="social-post"><div class="post-header"><div class="post-avatar">${(p.author_name||'U')[0]}</div><div><div class="post-author">${p.author_name||'Anonymous'}</div><div class="post-meta">${p.location_name?'📍 '+p.location_name:''} • ${p.created_at}</div></div></div>${stars?`<div class="post-rating">${stars}</div>`:''}<div class="post-title">${p.title}</div>${p.story?`<div class="post-story">${p.story}</div>`:''}${photos.length?`<div class="post-photos">${photos.map(ph=>`<img src="${ph}" class="post-photo" onclick="viewPhoto('${ph}')">`).join('')}</div>`:''}<div class="post-actions"><button onclick="likePost('${p.id}')" class="post-action-btn">❤️ ${p.likes_count||0}</button><button onclick="openComments('${p.id}')" class="post-action-btn">💬 Comment</button></div></div>`;
      }).join('');
    });
  }, 200);
}

// ═══════════ MAP ═══════════
function initMainMap() {}

function openMapModal() {
  document.getElementById('map-modal').classList.remove('hidden');
  setTimeout(() => {
    if (!state.maps.main) {
      state.maps.main = createMap('map', FIJI_CENTER, FIJI_ZOOM);
      state.markers.main = [];

      state.locations.forEach(loc => {
        const info = HOTEL_INFO[loc.id] || {};
        const imgHtml = info.img ? `<div class="popup-img"><img src="${info.img}" alt="${loc.name}" onerror="this.parentElement.style.display='none'"></div>` : '';
        const starsHtml = info.stars ? `<span class="popup-stars">${info.stars}</span>` : '';
        const typeHtml = info.type ? `<span class="popup-type">${info.type}</span>` : '';
        const descHtml = info.desc ? `<p class="popup-desc">${info.desc}</p>` : '';
        const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name + ' Fiji')}`;
        const googleReviewUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name + ' Fiji')}&review=1`;
        addMarker(state.maps.main, loc.lat, loc.lng,
          `<div style="font-size:1.4rem;text-shadow:0 1px 3px rgba(0,0,0,0.3)">${loc.icon}</div>`,
          { className: 'location-marker', popup: `<div class="hotel-popup">${imgHtml}<div class="popup-header"><span class="popup-icon">${loc.icon}</span><div><b>${loc.name}</b>${starsHtml}<br><small class="popup-coords">${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}</small></div></div>${typeHtml ? `<div class="popup-meta">${typeHtml} <span class="popup-zone">${loc.zone}</span></div>` : ''}${descHtml}<div class="popup-actions"><a href="${googleMapUrl}" target="_blank" class="popup-btn">📍 Google Maps</a><a href="${googleReviewUrl}" target="_blank" class="popup-btn popup-reviews">⭐ Reviews</a></div></div>`, maxWidth: 320, zIndex: 2 }
        );
      });

      state.maps.main.on('click', (e) => {
        const { lat, lng } = e.latlng;
        L.popup({ closeOnClick: true, autoClose: true, className: 'coord-popup' })
          .setLatLng([lat, lng])
          .setContent(`<div style="font-family:monospace;font-size:0.85rem;white-space:nowrap">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>`)
          .openOn(state.maps.main);
        const nearest = findNearestLocation(lat, lng);
        if (nearest) {
          if (!state.pickup || (state.pickup && state.dropoff)) { setPickup(nearest); state.dropoff = null; }
          else setDropoff(nearest);
          updateMapModalInfo();
        }
      });
    }
    state.maps.main.invalidateSize();
    updateMapMarkers('main');
    if (state.pickup && state.dropoff) {
      fitMapBounds(state.maps.main, [[state.pickup.lat, state.pickup.lng], [state.dropoff.lat, state.dropoff.lng]]);
    } else if (state.pickup) {
      state.maps.main.setView([state.pickup.lat, state.pickup.lng], 13);
    }
    updateMapModalInfo();
  }, 100);
}

function closeMapModal() {
  document.getElementById('map-modal').classList.add('hidden');
  updateLocationDisplay();
  if (state.pickup && state.dropoff) getEstimate();
}

function updateMapModalInfo() {
  const info = document.getElementById('map-modal-info');
  if (state.pickup && state.dropoff) info.textContent = `${state.pickup.name} \u2192 ${state.dropoff.name}`;
  else if (state.pickup) info.textContent = `Pickup: ${state.pickup.name} \u2014 tap destination`;
  else info.textContent = 'Tap pickup location';
}

function initActiveMap() {
  if (state.maps.active) { state.maps.active.invalidateSize(); return; }
  setTimeout(() => {
    state.maps.active = createMap('active-map', FIJI_CENTER, FIJI_ZOOM);
    state.markers.active = [];
    updateActiveMap();
  }, 100);
}

function initDriverMap() {
  if (state.maps.driver) { state.maps.driver.invalidateSize(); return; }
  setTimeout(() => { state.maps.driver = createMap('driver-map', FIJI_CENTER, FIJI_ZOOM); }, 100);
}

function findNearestLocation(lat, lng) {
  let best = null, bestDist = Infinity;
  state.locations.forEach(loc => {
    if (state.mode === 'land' && !loc.modes.includes('land')) return;
    if (state.mode === 'sea' && !loc.modes.includes('sea')) return;
    const d = haversine(lat, lng, loc.lat, loc.lng);
    if (d < bestDist) { bestDist = d; best = loc; }
  });
  return best;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function updateMapMarkers(mapKey) {
  const map = state.maps[mapKey];
  if (!map) return;
  clearMapObjects(state.markers[mapKey]);
  clearMapObjects(state.overlays[mapKey]);
  state.markers[mapKey] = [];
  state.overlays[mapKey] = [];

  if (state.pickup) {
    const m = addMarker(map, state.pickup.lat, state.pickup.lng,
      '<div style="width:24px;height:24px;border-radius:50%;background:#00e5cc;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
      { className: 'pickup-marker', iconSize: [24, 24], iconAnchor: [12, 12], popup: `\uD83D\uDCCD Pickup: ${state.pickup.name}`, zIndex: 5 }
    );
    state.markers[mapKey].push(m);
  }
  if (state.dropoff) {
    const m = addMarker(map, state.dropoff.lat, state.dropoff.lng,
      '<div style="width:24px;height:24px;border-radius:50%;background:#ffc93c;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
      { className: 'dropoff-marker', iconSize: [24, 24], iconAnchor: [12, 12], popup: `\uD83C\uDFC1 Drop-off: ${state.dropoff.name}`, zIndex: 5 }
    );
    state.markers[mapKey].push(m);
  }
  if (state.pickup && state.dropoff) {
    const line = addPolyline(map, [[state.pickup.lat, state.pickup.lng], [state.dropoff.lat, state.dropoff.lng]], { color: '#00e5cc', weight: 3, dash: true, opacity: 0.7 });
    state.overlays[mapKey] = state.overlays[mapKey] || [];
    state.overlays[mapKey].push(line);
    fitMapBounds(map, [[state.pickup.lat, state.pickup.lng], [state.dropoff.lat, state.dropoff.lng]]);
  }
}

// ═══════════ GEOLOCATION ═══════════
function useMyLocation() {
  const display = document.getElementById('pickup-display');
  display.textContent = '\uD83D\uDCE1 Getting your location...';
  display.classList.remove('placeholder');
  if (!navigator.geolocation) { display.textContent = '\u274C Geolocation not supported'; return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => onRiderPosition(pos),
    () => { display.textContent = '\u274C Location access denied'; display.classList.add('placeholder'); alert('Please allow location access.'); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// ═══════════ MODE ═══════════
function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.mode-btn[data-mode="${mode}"]`).classList.add('active');
  state.pickup = null; state.dropoff = null; state.selectedVehicle = null; state.estimate = null;
  updateLocationDisplay();
  document.getElementById('estimate-card').classList.add('hidden');
  document.getElementById('vehicle-options').classList.add('hidden');
  document.getElementById('confirm-btn').classList.add('hidden');
}

// ═══════════ LOCATION PICKER ═══════════
let pickerTarget = 'pickup', modeFilter = 'all';

function openLocationPicker(target) {
  pickerTarget = target;
  document.getElementById('location-modal').classList.remove('hidden');
  document.getElementById('modal-title').textContent = target === 'pickup' ? 'Select Pickup' : 'Select Drop-off';
  document.getElementById('location-search').value = '';
  modeFilter = state.mode || 'all';
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.filter-btn[onclick*="${modeFilter}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  renderLocationList();
}

function closeLocationPicker() { document.getElementById('location-modal').classList.add('hidden'); }
function filterMode(mode, btn) { modeFilter = mode; document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderLocationList(); }

function renderLocationList() {
  const query = document.getElementById('location-search').value.toLowerCase();
  const seaZones = ['denarau','mamanuca','yasawa','kadavu','beqa'];
  const seaIds = ['naisoso'];
  const filtered = state.locations.filter(loc => {
    if (modeFilter === 'sea') {
      const isSea = seaZones.includes(loc.zone) || seaIds.includes(loc.id);
      if (!isSea) return false;
    }
    return loc.name.toLowerCase().includes(query) || loc.zone.toLowerCase().includes(query);
  });
  document.getElementById('location-list').innerHTML = filtered.map(loc => `
    <div class="loc-list-item" onclick="selectLocation('${loc.id}')">
      <span class="loc-list-icon">${loc.icon}</span>
      <div><div class="loc-list-name">${loc.name}</div><div class="loc-list-zone">${loc.zone} \u2022 ${loc.modes.join(', ')} \u2022 ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}</div></div>
    </div>`).join('') || '<div class="empty-state"><p>No locations found</p></div>';
}

function selectLocation(locId) {
  const loc = state.locations.find(l => l.id === locId);
  if (!loc) return;
  if (pickerTarget === 'pickup') state.pickup = loc; else state.dropoff = loc;
  closeLocationPicker(); updateLocationDisplay();
  if (state.pickup && state.dropoff) getEstimate();
}

function setPickup(loc) { state.pickup = loc; updateLocationDisplay(); if (state.dropoff) getEstimate(); }
function setDropoff(loc) { state.dropoff = loc; updateLocationDisplay(); if (state.pickup) getEstimate(); }

function updateLocationDisplay() {
  const p = document.getElementById('pickup-display'), d = document.getElementById('dropoff-display');
  if (state.pickup) { p.textContent = `${state.pickup.icon} ${state.pickup.name}`; p.classList.remove('placeholder'); }
  else { p.textContent = 'Where are you?'; p.classList.add('placeholder'); }
  if (state.dropoff) { d.textContent = `${state.dropoff.icon} ${state.dropoff.name}`; d.classList.remove('placeholder'); }
  else { d.textContent = 'Where to?'; d.classList.add('placeholder'); }
  updateMapMarkers('main');
}

// ═══════════ PRICE ESTIMATE ═══════════
async function getEstimate() {
  if (!state.pickup || !state.dropoff) return;
  try {
    const params = new URLSearchParams({ pickup_lat: state.pickup.lat, pickup_lng: state.pickup.lng, dropoff_lat: state.dropoff.lat, dropoff_lng: state.dropoff.lng, mode: state.mode });
    state.estimate = await api(`/api/estimate?${params}`);
    renderEstimate();
  } catch (err) { console.error('Estimate error:', err); }
}

function renderEstimate() {
  if (!state.estimate) return;
  const est = state.estimate;
  document.getElementById('est-distance').textContent = `${est.distance_km} km`;
  document.getElementById('est-duration').textContent = `${est.duration_min} min`;
  document.getElementById('est-surge').textContent = `${est.surge.toFixed(1)}x surge`;
  document.getElementById('estimate-card').classList.remove('hidden');
  const FEATURE_ICONS = { 'ac':'❄️','music':'🎵','phone-charger':'🔌','wifi':'📶','water':'💧','luggage':'🧳','life-jacket':'🦺','snorkel-gear':'🤿','cooler':'🧊','fishing-gear':'🎣','sun-deck':'☀️','captain':'👨‍✈️','cafe':'☕','restroom':'🚻','deck':'🛳️','bar':'🍸','cabin':'🛏️' };
  const FEATURE_NAMES = { 'ac':'A/C','music':'Music','phone-charger':'Charger','wifi':'WiFi','water':'Water','luggage':'Luggage','life-jacket':'Life Jacket','snorkel-gear':'Snorkel','cooler':'Cooler','fishing-gear':'Fishing','sun-deck':'Sun Deck','captain':'Captain','cafe':'Café','restroom':'Restroom','deck':'Deck','bar':'Bar','cabin':'Cabin' };
  document.getElementById('vehicle-list').innerHTML = Object.values(est.estimates).map(v => {
    const feats = (v.features || []).map(f => `<span class="feat-tag">${FEATURE_ICONS[f]||''} ${FEATURE_NAMES[f]||f}</span>`).join('');
    return `
    <div class="vehicle-card" onclick="selectVehicle('${v.type}')" data-type="${v.type}">
      <span class="vehicle-emoji">${v.emoji}</span>
      <div class="vehicle-info">
        <div class="vehicle-name">${v.name}</div>
        <div class="vehicle-desc">${v.desc}</div>
        <div class="vehicle-cap">\uD83D\uDC65 Up to ${v.cap} passengers</div>
        ${feats ? `<div class="vehicle-features">${feats}</div>` : ''}
      </div>
      <span class="vehicle-price">FJ$${v.price.toFixed(2)}</span>
    </div>`;
  }).join('');
  document.getElementById('vehicle-options').classList.remove('hidden');
}

function selectVehicle(type) {
  state.selectedVehicle = type;
  document.querySelectorAll('.vehicle-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.vehicle-card[data-type="${type}"]`).classList.add('selected');
  const v = state.estimate.estimates[type];
  document.getElementById('confirm-text').textContent = `Request ${v.name}`;
  document.getElementById('confirm-price').textContent = `FJ$${v.price.toFixed(2)}`;
  document.getElementById('confirm-btn').classList.remove('hidden');
}

// ═══════════ REQUEST RIDE ═══════════
async function requestRide() {
  if (!state.pickup || !state.dropoff || !state.selectedVehicle) return;
  try {
    const ride = await api('/api/rides', { method: 'POST', body: JSON.stringify({
      rider_id: state.user.id, mode: state.mode,
      pickup_lat: state.pickup.lat, pickup_lng: state.pickup.lng, pickup_name: state.pickup.name,
      dropoff_lat: state.dropoff.lat, dropoff_lng: state.dropoff.lng, dropoff_name: state.dropoff.name,
      vehicle_type: state.selectedVehicle, passengers: 1,
    })});
    state.currentRide = ride;
    if (ride.status === 'matched' && ride.provider_id) showActiveRide(ride);
    else showRequesting(ride);
  } catch (err) { alert('Failed to request ride: ' + err.message); }
}

function showRequesting(ride) {
  document.querySelectorAll('.app-section').forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
  document.getElementById('section-requesting').classList.remove('hidden');
  document.getElementById('section-requesting').classList.add('active');
  document.getElementById('req-pickup').textContent = ride.pickup_name;
  document.getElementById('req-dropoff').textContent = ride.dropoff_name;
  pollRideStatus(ride.id);
}

function showActiveRide(ride) {
  document.querySelectorAll('.app-section').forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
  document.getElementById('section-active').classList.remove('hidden');
  document.getElementById('section-active').classList.add('active');
  updateActiveRideUI(ride);
  initActiveMap();
  setupLiveTracking(ride);
  pollRideStatus(ride.id);
}

// ═══════════ LIVE DRIVER TRACKING ═══════════
let driverTrackingMarker = null, driverRouteLine = null, driverRoutePath = null;
let trackingInterval = null, driverSimPos = null;
let trackingPhase = 'pickup';
let driverFromLat, driverFromLng, driverToLat, driverToLng;
let driverAnimProgress = 0, driverAnimSpeed = 0.004;
let remainingKm = 0, remainingMin = 0;

async function setupLiveTracking(ride) {
  stopLiveTracking();
  if (!ride.provider) return;
  const provLat = ride.provider.lat || -17.8018, provLng = ride.provider.lng || 177.4534;
  driverFromLat = provLat; driverFromLng = provLng;
  driverToLat = ride.pickup_lat; driverToLng = ride.pickup_lng;
  driverAnimProgress = 0; trackingPhase = 'pickup';
  driverSimPos = { lat: driverFromLat, lng: driverFromLng };

  const map = state.maps.active;
  if (!map) return;

  const routeCoords = await generateRoutePoints(driverFromLat, driverFromLng, driverToLat, driverToLng);
  driverRoutePath = routeCoords;
  const roadDist = calcRoadDistance(routeCoords);
  driverAnimSpeed = roadDist > 50 ? 0.0008 : roadDist > 20 ? 0.002 : roadDist > 5 ? 0.005 : 0.01;
  remainingKm = roadDist; remainingMin = ride.duration_min || Math.round(roadDist * 2.5);

  driverRouteLine = addPolyline(map, routeCoords, { color: '#00e5cc', weight: 4, dash: true, opacity: 0.7 });
  driverTrackingMarker = addMarker(map, provLat, provLng,
    '<div style="position:relative;width:36px;height:36px;"><div style="position:absolute;inset:0;border-radius:50%;background:rgba(255,201,60,0.2);animation:myLocPulse 1.8s ease-in-out infinite;"></div><div style="position:absolute;top:3px;left:3px;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#ffc93c,#f4845f);display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4);">\uD83D\uDE97</div></div>',
    { className: 'driver-tracking-icon', iconSize: [40, 40], iconAnchor: [20, 20], popup: '<b>\uD83D\uDE97 Driver en route</b>', zIndex: 1000 }
  );

  fitMapBounds(map, [[provLat, provLng], [ride.pickup_lat, ride.pickup_lng]], 60);
  trackingInterval = setInterval(() => animateDriver(), 50);
  updateTrackingUI();
}

function calcRoadDistance(coords) {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += haversine(coords[i-1][0], coords[i-1][1], coords[i][0], coords[i][1]);
  return total;
}

function animateDriver() {
  if (!driverRoutePath || driverAnimProgress >= 1) return;
  driverAnimProgress = Math.min(driverAnimProgress + driverAnimSpeed, 1);
  const idx = Math.min(Math.floor(driverAnimProgress * (driverRoutePath.length - 1)), driverRoutePath.length - 2);
  const t = (driverAnimProgress * (driverRoutePath.length - 1)) - idx;
  const p1 = driverRoutePath[idx], p2 = driverRoutePath[idx + 1];
  const lat = p1[0] + (p2[0] - p1[0]) * t, lng = p1[1] + (p2[1] - p1[1]) * t;
  driverSimPos = { lat, lng };

  if (driverTrackingMarker) driverTrackingMarker.setLatLng([lat, lng]);

  let roadRemaining = haversine(lat, lng, driverRoutePath[idx+1][0], driverRoutePath[idx+1][1]);
  for (let i = idx + 1; i < driverRoutePath.length - 1; i++) roadRemaining += haversine(driverRoutePath[i][0], driverRoutePath[i][1], driverRoutePath[i+1][0], driverRoutePath[i+1][1]);
  remainingKm = roadRemaining;
  remainingMin = Math.max(1, Math.round(roadRemaining * 2.5));
  updateTrackingUI();
  sendDriverLocation(lat, lng);

  if (driverAnimProgress >= 1) {
    clearInterval(trackingInterval); trackingInterval = null;
    if (trackingPhase === 'pickup') onDriverArrivedAtPickup();
    else onDriverArrivedAtDropoff();
  }
}

async function onDriverArrivedAtPickup() {
  trackingPhase = 'dropoff'; driverAnimProgress = 0;
  const ride = state.currentRide;
  if (!ride) return;
  driverFromLat = ride.pickup_lat; driverFromLng = ride.pickup_lng;
  driverToLat = ride.dropoff_lat; driverToLng = ride.dropoff_lng;

  const map = state.maps.active;
  if (driverRouteLine) driverRouteLine.remove();
  const newCoords = await generateRoutePoints(driverFromLat, driverFromLng, driverToLat, driverToLng);
  driverRoutePath = newCoords;
  const roadDist = calcRoadDistance(newCoords);
  driverAnimSpeed = roadDist > 50 ? 0.0008 : roadDist > 20 ? 0.002 : roadDist > 5 ? 0.005 : 0.01;
  remainingKm = roadDist; remainingMin = Math.round(roadDist * 2.5);

  driverRouteLine = addPolyline(map, newCoords, { color: '#f4845f', weight: 4, dash: true, opacity: 0.7 });
  if (map) fitMapBounds(map, [[driverFromLat, driverFromLng], [driverToLat, driverToLng]], 60);
  updateTrackingUI();
  document.getElementById('ride-status-text').textContent = '\uD83D\uDE97 Ride in progress \u2014 enjoy the scenery!';
  trackingInterval = setInterval(() => animateDriver(), 50);
}

function onDriverArrivedAtDropoff() {
  document.getElementById('ride-status-text').textContent = '\u2705 Arrived at destination!';
  document.getElementById('active-eta').textContent = '0 min';
  document.getElementById('active-distance').textContent = '0 km';
}

function updateTrackingUI() {
  document.getElementById('active-distance').textContent = `${remainingKm.toFixed(1)} km`;
  document.getElementById('active-eta').textContent = `${remainingMin} min`;
}

function stopLiveTracking() {
  if (trackingInterval) { clearInterval(trackingInterval); trackingInterval = null; }
  if (driverTrackingMarker) { driverTrackingMarker.remove(); driverTrackingMarker = null; }
  if (driverRouteLine) { driverRouteLine.remove(); driverRouteLine = null; }
  driverRoutePath = null; driverAnimProgress = 0;
}

function generateRoutePoints(lat1, lng1, lat2, lng2) {
  return new Promise((resolve) => {
    fetch(`https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&steps=false`)
      .then(r => r.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes?.[0]) resolve(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
        else resolve(backupRoutePoints(lat1, lng1, lat2, lng2));
      })
      .catch(() => resolve(backupRoutePoints(lat1, lng1, lat2, lng2)));
  });
}

function backupRoutePoints(lat1, lng1, lat2, lng2) {
  const points = [], steps = 30;
  const midLat = (lat1+lat2)/2, midLng = (lng1+lng2)/2;
  const dist = haversine(lat1, lng1, lat2, lng2);
  const curve = Math.min(dist * 0.06, 0.06);
  const perpLat = -(lng2-lng1)*curve/Math.max(dist,0.1), perpLng = (lat2-lat1)*curve/Math.max(dist,0.1);
  for (let i = 0; i <= steps; i++) {
    const t = i/steps;
    points.push([(1-t)*(1-t)*lat1+2*(1-t)*t*(midLat+perpLat)+t*t*lat2, (1-t)*(1-t)*lng1+2*(1-t)*t*(midLng+perpLng)+t*t*lng2]);
  }
  return points;
}

async function sendDriverLocation(lat, lng) { try { await api('/api/providers/me', { method: 'PUT', body: JSON.stringify({ lat, lng }) }); } catch {} }

function updateActiveRideUI(ride) {
  const statusTexts = { matched: 'Driver assigned! On the way...', accepted: 'Driver accepted! Heading to you...', in_progress: 'Ride in progress \u2014 enjoy the view!', completed: 'Ride complete!' };
  document.getElementById('ride-status-text').textContent = statusTexts[ride.status] || ride.status;
  if (ride.provider) {
    document.getElementById('driver-name').textContent = ride.provider.name;
    document.getElementById('driver-rating').textContent = ride.provider.rating;
    document.getElementById('driver-vehicle').textContent = `${ride.provider.vehicle_name} \u2022 ${ride.provider.vehicle_plate}`;
    document.getElementById('driver-avatar').textContent = ride.mode === 'sea' ? '\uD83D\uDEA4' : '\uD83D\uDE97';
  }
  document.getElementById('active-pickup').textContent = ride.pickup_name;
  document.getElementById('active-dropoff').textContent = ride.dropoff_name;
  document.getElementById('active-fare').textContent = `FJ$${ride.price_fjd?.toFixed(2)}`;
  document.getElementById('active-distance').textContent = `${ride.distance_km} km`;
  document.getElementById('active-eta').textContent = `${ride.duration_min} min`;
  if (ride.status === 'completed') showCompleteScreen(ride);
}

function updateActiveMap() {
  if (!state.currentRide) return;
  const ride = state.currentRide;
  if (state.maps.active) {
    state.pickup = { lat: ride.pickup_lat, lng: ride.pickup_lng, name: ride.pickup_name };
    state.dropoff = { lat: ride.dropoff_lat, lng: ride.dropoff_lng, name: ride.dropoff_name };
    updateMapMarkers('active');
  }
}

async function pollRideStatus(rideId) {
  if (state.polling) clearInterval(state.polling);
  state.polling = setInterval(async () => {
    try {
      const ride = await api(`/api/rides/${rideId}`);
      state.currentRide = ride;
      if (ride.status === 'completed' || ride.status === 'cancelled') {
        clearInterval(state.polling); stopLiveTracking();
        if (ride.status === 'completed') showCompleteScreen(ride);
        else showSection('home');
      } else if (['accepted','in_progress','matched'].includes(ride.status)) {
        updateActiveRideUI(ride);
        if (ride.provider && driverTrackingMarker && driverAnimProgress >= 1) {
          const sLat = ride.provider.lat, sLng = ride.provider.lng;
          if (sLat && sLng) {
            const cur = driverTrackingMarker.getLatLng();
            if (haversine(cur.lat, cur.lng, sLat, sLng) > 0.05) driverTrackingMarker.setLatLng([sLat, sLng]);
          }
        }
      }
    } catch {}
  }, 3000);
}

// ═══════════ RIDE ACTIONS ═══════════
async function cancelRide() {
  if (!state.currentRide) return;
  try { await api(`/api/rides/${state.currentRide.id}/cancel`, { method: 'PUT' }); clearInterval(state.polling); state.currentRide = null; showSection('home'); }
  catch (err) { alert('Failed to cancel: ' + err.message); }
}
async function cancelActiveRide() { if (!confirm('Are you sure you want to cancel this ride?')) return; await cancelRide(); }
async function triggerSOS() {
  if (!confirm('\uD83D\uDEA8 Send SOS Emergency Alert?')) return;
  try { await api('/api/sos', { method: 'POST', body: JSON.stringify({ ride_id: state.currentRide?.id, user_id: state.user?.id }) }); alert('\uD83D\uDEA8 SOS Alert sent!'); }
  catch { alert('SOS alert sent (offline).'); }
}
function shareRide() {
  if (!state.currentRide) return;
  const url = `${API_BASE}/ride/${state.currentRide.id}`;
  if (navigator.clipboard) { navigator.clipboard.writeText(url).then(() => alert('\uD83D\uDCE4 Ride link copied!\n' + url)).catch(() => alert('Link: ' + url)); }
  else alert('Ride link: ' + url);
}
function callDriver() { alert('\uD83D\uDCDE Calling driver...'); }
function messageDriver() { alert('\uD83D\uDCAC Opening chat...'); }

// ═══════════ RIDE COMPLETE ═══════════
let currentRating = 5;
function showCompleteScreen(ride) {
  document.querySelectorAll('.app-section').forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
  document.getElementById('section-complete').classList.remove('hidden');
  document.getElementById('section-complete').classList.add('active');
  document.getElementById('complete-route').textContent = `${ride.pickup_name} \u2192 ${ride.dropoff_name}`;
  document.getElementById('complete-fare').textContent = `FJ$${ride.price_fjd?.toFixed(2)}`;
  currentRating = 5; updateStars(5);
  document.getElementById('review-text').value = '';
}
function setRating(r) { currentRating = r; updateStars(r); }
function updateStars(r) { document.querySelectorAll('#star-rating .star').forEach((s, i) => s.classList.toggle('active', i < r)); }
async function submitRating() {
  if (!state.currentRide) return;
  try { await api(`/api/rides/${state.currentRide.id}/rate`, { method: 'PUT', body: JSON.stringify({ rider_id: state.user.id, rating: currentRating, review: document.getElementById('review-text').value || undefined }) }); } catch {}
  state.currentRide = null; showSection('home');
}

// ═══════════ HISTORY ═══════════
async function loadHistory() {
  const list = document.getElementById('history-list');
  if (!state.user) { list.innerHTML = '<div class="empty-state"><span class="empty-icon">\uD83C\uDFDF\uFE0F</span><p>Please log in to see your trips</p></div>'; return; }
  try {
    const rides = await api(`/api/rides?rider_id=${state.user.id}`);
    if (!rides.length) { list.innerHTML = '<div class="empty-state"><span class="empty-icon">\uD83C\uDFDF\uFE0F</span><p>No trips yet. Time to explore Fiji!</p></div>'; return; }
    list.innerHTML = rides.map(r => `
      <div class="history-card">
        <div class="history-mode">${r.mode === 'sea' ? '\uD83D\uDEA4' : '\uD83D\uDE97'}</div>
        <div class="history-info">
          <div class="history-route">${r.pickup_name || 'Pickup'} \u2192 ${r.dropoff_name || 'Drop-off'}</div>
          <div class="history-meta"><span>${r.distance_km} km</span><span>${r.duration_min} min</span><span>${r.vehicle_type}</span></div>
        </div>
        <div class="history-fare">
          <div class="history-price">FJ$${r.price_fjd?.toFixed(2)}</div>
          <span class="history-status status-${r.status}">${r.status.replace('_', ' ')}</span>
        </div>
      </div>`).join('');
  } catch { list.innerHTML = '<div class="empty-state"><p>Could not load trips</p></div>'; }
}

// ═══════════ WALLET ═══════════
async function loadWallet() {
  if (!state.user) return;
  try {
    const wallet = await api('/api/wallet');
    document.getElementById('wallet-balance').textContent = `FJ$${wallet.balance.toFixed(2)}`;
    document.getElementById('wallet-balance-big').textContent = wallet.balance.toFixed(2);
    const txns = await api('/api/wallet/transactions');
    document.getElementById('transactions-list').innerHTML = txns.length ? txns.map(t => `
      <div class="transaction-item">
        <div><div class="transaction-desc">${t.description || t.type}</div><div class="transaction-time">${new Date(t.created_at).toLocaleString()}</div></div>
        <div class="transaction-amount ${t.type === 'topup' ? 'credit' : 'debit'}">${t.type === 'topup' ? '+' : '-'}FJ$${t.amount.toFixed(2)}</div>
      </div>`).join('') : '<div class="empty-state"><p>No transactions yet</p></div>';
  } catch (err) { console.error('Wallet error:', err); }
}
async function topup(amount) {
  if (!state.user) return;
  try { await api('/api/wallet/topup', { method: 'POST', body: JSON.stringify({ user_id: state.user.id, amount }) }); loadWallet(); }
  catch (err) { alert('Top-up failed: ' + err.message); }
}
function topupCustom() { const v = parseFloat(document.getElementById('custom-topup').value); if (v > 0) topup(v); }

// ═══════════ GUIDE / BULA BOT ═══════════
function initGuide() {}
async function askBot(question) {
  addChatMessage(question, 'user');
  try { const res = await api('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message: question, location: state.pickup }) }); addChatMessage(res.reply || res.response || "I'm not sure about that.", 'bot'); }
  catch { addChatMessage("Bula! I couldn't connect right now.", 'bot'); }
}
async function sendChat(e) { e.preventDefault(); const input = document.getElementById('chat-text'); const msg = input.value.trim(); if (!msg) return; input.value = ''; await askBot(msg); }
function addChatMessage(text, type) { const c = document.getElementById('chat-messages'); const b = document.createElement('div'); b.className = `chat-bubble ${type}`; b.innerHTML = `<p>${text}</p>`; c.appendChild(b); c.scrollTop = c.scrollHeight; }

// ═══════════ DRIVER MODE ═══════════
async function loadDriverProfile() { try { const p = await api('/api/providers/me'); state.driverProfile = p; if (p) { document.getElementById('stat-rides').textContent = p.total_rides; document.getElementById('stat-rating').textContent = p.rating; } } catch {} }
function initDriverHome() { initDriverMap(); if (state.driverProfile) { document.getElementById('stat-rides').textContent = state.driverProfile.total_rides; document.getElementById('stat-rating').textContent = state.driverProfile.rating; } }

async function toggleDriverOnline() {
  const isOnline = document.getElementById('driver-online').checked;
  document.getElementById('driver-status-label').textContent = isOnline ? 'Online \u2014 Accepting Rides' : 'Offline';
  if (isOnline && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => { try { await api('/api/providers/me', { method: 'PUT', body: JSON.stringify({ available: true, lat: pos.coords.latitude, lng: pos.coords.longitude }) }); showDriverMapMarker(pos.coords.latitude, pos.coords.longitude); } catch {} },
      () => { api('/api/providers/me', { method: 'PUT', body: JSON.stringify({ available: true }) }).catch(() => {}); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  } else { try { await api('/api/providers/me', { method: 'PUT', body: JSON.stringify({ available: isOnline }) }); } catch {} }
}

let driverMapMarker = null;
function showDriverMapMarker(lat, lng) {
  const map = state.maps.driver; if (!map) return;
  if (driverMapMarker) driverMapMarker.remove();
  driverMapMarker = addMarker(map, lat, lng,
    '<div style="position:relative;width:36px;height:36px;"><div style="position:absolute;inset:0;border-radius:50%;background:rgba(255,201,60,0.2);animation:myLocPulse 1.8s ease-in-out infinite;"></div><div style="position:absolute;top:3px;left:3px;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#ffc93c,#f4845f);display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4);">\uD83D\uDE97</div></div>',
    { className: 'driver-map-marker', iconSize: [40, 40], iconAnchor: [20, 20], popup: '<b>You are here</b>', zIndex: 1000 }
  );
  map.setView([lat, lng], 14);
}

let currentDriverRide = null;
async function acceptRide() {
  if (!currentDriverRide) return;
  try { await api(`/api/rides/${currentDriverRide.id}/accept`, { method: 'PUT', body: JSON.stringify({ provider_id: state.driverProfile.id }) }); document.getElementById('incoming-ride').classList.add('hidden'); showDriverActiveRide(currentDriverRide); }
  catch (err) { alert('Failed to accept: ' + err.message); }
}
async function declineRide() {
  if (!currentDriverRide) return;
  try { await api(`/api/rides/${currentDriverRide.id}/decline`, { method: 'PUT', body: JSON.stringify({ provider_id: state.driverProfile.id }) }); document.getElementById('incoming-ride').classList.add('hidden'); currentDriverRide = null; } catch {}
}

function showDriverActiveRide(ride) {
  currentDriverRide = ride;
  document.getElementById('driver-active-ride').classList.remove('hidden');
  document.getElementById('driver-ride-route').textContent = `${ride.pickup_name || 'Pickup'} \u2192 ${ride.dropoff_name || 'Drop-off'}`;
  document.getElementById('driver-ride-fare').textContent = `FJ$${ride.price_fjd?.toFixed(2)}`;
  document.getElementById('driver-ride-status').textContent = ride.status;
  updateDriverActionBtn(ride.status);
  showDriverRoute(ride);
}

async function showDriverRoute(ride) {
  const map = state.maps.driver; if (!map) return;
  const overlays = state.overlays.driver || [];
  clearMapObjects(overlays);
  state.overlays.driver = [];

  const fromLat = ride.provider?.lat || driverSimPos?.lat || -17.8018;
  const fromLng = ride.provider?.lng || driverSimPos?.lng || 177.4534;

  const routeCoords = await generateRoutePoints(fromLat, fromLng, ride.pickup_lat, ride.pickup_lng);
  const line = addPolyline(map, routeCoords, { color: '#00e5cc', weight: 4, dash: true, opacity: 0.7 });
  state.overlays.driver.push(line);

  state.overlays.driver.push(addMarker(map, fromLat, fromLng,
    '<div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#ffc93c,#f4845f);display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">\uD83D\uDE97</div>',
    { className: 'driver-map-marker', iconSize: [30, 30], iconAnchor: [15, 15], popup: '<b>You are here</b>', zIndex: 5 }
  ));
  state.overlays.driver.push(addMarker(map, ride.pickup_lat, ride.pickup_lng,
    '<div style="width:24px;height:24px;border-radius:50%;background:#00e5cc;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
    { className: 'pickup-marker', iconSize: [24, 24], iconAnchor: [12, 12], popup: `<b>\uD83D\uDCCD Pickup</b><br>${ride.pickup_name}`, zIndex: 5 }
  ));
  state.overlays.driver.push(addMarker(map, ride.dropoff_lat, ride.dropoff_lng,
    '<div style="width:24px;height:24px;border-radius:50%;background:#ffc93c;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
    { className: 'dropoff-marker', iconSize: [24, 24], iconAnchor: [12, 12], popup: `<b>\uD83C\uDFC1 Drop-off</b><br>${ride.dropoff_name}`, zIndex: 5 }
  ));

  fitMapBounds(map, [[fromLat, fromLng], [ride.pickup_lat, ride.pickup_lng], [ride.dropoff_lat, ride.dropoff_lng]], 50);
}

function updateDriverActionBtn(status) {
  const btn = document.getElementById('driver-action-btn');
  switch (status) { case 'matched': btn.textContent = 'Accept Ride'; break; case 'accepted': btn.textContent = 'Start Ride'; break; case 'in_progress': btn.textContent = 'Complete Ride'; break; default: btn.textContent = 'Update'; }
}

async function driverAction() {
  if (!currentDriverRide) return;
  try {
    if (['matched','searching'].includes(currentDriverRide.status)) { await api(`/api/rides/${currentDriverRide.id}/accept`, { method: 'PUT', body: JSON.stringify({ provider_id: state.driverProfile.id }) }); currentDriverRide.status = 'accepted'; }
    else if (currentDriverRide.status === 'accepted') { await api(`/api/rides/${currentDriverRide.id}/start`, { method: 'PUT' }); currentDriverRide.status = 'in_progress'; }
    else if (currentDriverRide.status === 'in_progress') { await api(`/api/rides/${currentDriverRide.id}/complete`, { method: 'PUT' }); currentDriverRide = null; document.getElementById('driver-active-ride').classList.add('hidden'); loadDriverProfile(); return; }
    updateDriverActionBtn(currentDriverRide.status);
    document.getElementById('driver-ride-status').textContent = currentDriverRide.status;
  } catch (err) { alert('Action failed: ' + err.message); }
}

async function driverComplete() {
  if (!currentDriverRide) return;
  try { await api(`/api/rides/${currentDriverRide.id}/complete`, { method: 'PUT' }); currentDriverRide = null; document.getElementById('driver-active-ride').classList.add('hidden'); loadDriverProfile(); }
  catch (err) { alert('Failed: ' + err.message); }
}

// ═══════════ SETTINGS ═══════════
async function testConnection() {
  try { await api('/api/locations'); document.getElementById('connection-status').innerHTML = '<span class="status-dot green"></span> Connected'; }
  catch { document.getElementById('connection-status').innerHTML = '<span class="status-dot red"></span> Connection failed'; }
}

// ═══════════ NOTIFICATIONS ═══════════
function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    setTimeout(() => {
      Notification.requestPermission().then(p => {
        if (p === 'granted') showNotifBanner('Notifications enabled! You\'ll receive ride updates and driver approval alerts.', 'success');
      });
    }, 2000);
  } else if (Notification.permission === 'denied') {
    showNotifBanner('Notifications are blocked. Please enable them in browser settings for ride updates.', 'warning');
  }
}
function sendLocalNotif(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '🚙', badge: '🏝️' });
  }
}
let notifPolling = null;
async function loadUserNotifications() {
  if (!state.user) return;
  try {
    const notifs = await api(`/api/users/${state.user.id}/notifications`);
    const unread = notifs.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (badge) { badge.textContent = unread || ''; badge.style.display = unread ? 'inline' : 'none'; }
    if (unread > 0) {
      const latest = notifs.find(n => !n.read);
      if (latest) { showNotifBanner(`${latest.title} — ${latest.body}`, latest.type === 'approval' ? 'success' : 'info'); sendLocalNotif(latest.title, latest.body); }
    }
  } catch {}
}
function showNotifBanner(message, type) {
  let banner = document.getElementById('notif-banner');
  if (!banner) { banner = document.createElement('div'); banner.id = 'notif-banner'; banner.className = 'notif-banner'; document.body.appendChild(banner); }
  const colors = { success: '#4caf50', info: '#00b4d8', warning: '#ffc107', error: '#f44336' };
  banner.style.background = colors[type] || colors.info;
  banner.textContent = message;
  banner.classList.add('show');
  setTimeout(() => banner.classList.remove('show'), 5000);
}
function showNotifications() {
  if (!state.user) return;
  api(`/api/users/${state.user.id}/notifications`).then(notifs => {
    const el = document.getElementById('notif-list');
    el.innerHTML = notifs.length ? notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead('${n.id}')">
        <div class="notif-title">${n.title}</div>
        <div class="notif-body">${n.body}</div>
        <div class="notif-time">${n.created_at}</div>
      </div>`).join('') : '<div class="empty-state"><p>No notifications yet</p></div>';
    document.getElementById('section-notif').classList.remove('hidden');
    document.querySelectorAll('.app-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('section-notif').classList.remove('hidden');
  });
}
function closeNotifSection() {
  document.getElementById('section-notif').classList.add('hidden');
  showSection('home');
}
async function markNotifRead(id) {
  await api(`/api/notifications/${id}/read`, { method: 'PUT' });
  loadUserNotifications();
  showNotifications();
}

// ═══════════ USER SETTINGS ═══════════
let userSettings = {};
async function loadUserSettings() {
  if (!state.user) return;
  try {
    userSettings = await api(`/api/users/${state.user.id}/settings`);
    applySettings();
  } catch {}
}
function applySettings() {
  if (userSettings.dark_mode) document.body.classList.remove('light-mode');
  else document.body.classList.add('light-mode');
}
function openSettings() {
  document.getElementById('settings-modal').classList.remove('hidden');
  populateSettings();
}
function closeSettings() { document.getElementById('settings-modal').classList.add('hidden'); }
function populateSettings() {
  document.getElementById('set-notifications').checked = userSettings.notifications !== 0;
  document.getElementById('set-location-sharing').checked = userSettings.location_sharing !== 0;
  document.getElementById('set-dark-mode').checked = userSettings.dark_mode !== 0;
  document.getElementById('set-sound').checked = userSettings.sound_enabled !== 0;
  document.getElementById('set-vibration').checked = userSettings.vibration !== 0;
  document.getElementById('set-language').value = userSettings.language || 'en';
  document.getElementById('set-radius').value = userSettings.radius_km || 5;
  document.getElementById('radius-val').textContent = (userSettings.radius_km || 5) + ' km';
  document.getElementById('set-radius').oninput = function() { document.getElementById('radius-val').textContent = this.value + ' km'; };
}
async function saveSettings() {
  if (!state.user) return;
  const s = {
    notifications: document.getElementById('set-notifications').checked ? 1 : 0,
    location_sharing: document.getElementById('set-location-sharing').checked ? 1 : 0,
    dark_mode: document.getElementById('set-dark-mode').checked ? 1 : 0,
    sound_enabled: document.getElementById('set-sound').checked ? 1 : 0,
    vibration: document.getElementById('set-vibration').checked ? 1 : 0,
    language: document.getElementById('set-language').value,
    radius_km: parseFloat(document.getElementById('set-radius').value) || 5,
  };
  await api(`/api/users/${state.user.id}/settings`, { method: 'PUT', body: JSON.stringify(s) });
  userSettings = { ...userSettings, ...s };
  applySettings();
  closeSettings();
  showNotifBanner('Settings saved!', 'success');
}
function logout() {
  localStorage.removeItem('pb_session');
  state.user = null; state.token = null;
  document.getElementById('app').classList.add('hidden');
  showScreen('auth-screen');
  if (notifPolling) clearInterval(notifPolling);
}
function showWallet() { showSection('wallet'); }

// ═══════════ TRANSLATION / i18n ═══════════
const COUNTRIES = [
  {code:'FJ',name:'Fiji',flag:'🇫🇯',lang:'en'},{code:'AU',name:'Australia',flag:'🇦🇺',lang:'en'},{code:'NZ',name:'New Zealand',flag:'🇳🇿',lang:'en'},
  {code:'US',name:'United States',flag:'🇺🇸',lang:'en'},{code:'GB',name:'United Kingdom',flag:'🇬🇧',lang:'en'},{code:'CA',name:'Canada',flag:'🇨🇦',lang:'en'},
  {code:'IN',name:'India',flag:'🇮🇳',lang:'hi'},{code:'CN',name:'China',flag:'🇨🇳',lang:'zh'},{code:'JP',name:'Japan',flag:'🇯🇵',lang:'ja'},
  {code:'KR',name:'South Korea',flag:'🇰🇷',lang:'ko'},{code:'DE',name:'Germany',flag:'🇩🇪',lang:'de'},{code:'FR',name:'France',flag:'🇫🇷',lang:'fr'},
  {code:'IT',name:'Italy',flag:'🇮🇹',lang:'it'},{code:'ES',name:'Spain',flag:'🇪🇸',lang:'es'},{code:'PT',name:'Portugal',flag:'🇵🇹',lang:'pt'},
  {code:'BR',name:'Brazil',flag:'🇧🇷',lang:'pt'},{code:'MX',name:'Mexico',flag:'🇲🇽',lang:'es'},{code:'RU',name:'Russia',flag:'🇷🇺',lang:'ru'},
  {code:'NL',name:'Netherlands',flag:'🇳🇱',lang:'nl'},{code:'SE',name:'Sweden',flag:'🇸🇪',lang:'sv'},{code:'NO',name:'Norway',flag:'🇳🇴',lang:'no'},
  {code:'DK',name:'Denmark',flag:'🇩🇰',lang:'da'},{code:'FI',name:'Finland',flag:'🇫🇮',lang:'fi'},{code:'CH',name:'Switzerland',flag:'🇨🇭',lang:'de'},
  {code:'AT',name:'Austria',flag:'🇦🇹',lang:'de'},{code:'BE',name:'Belgium',flag:'🇧🇪',lang:'fr'},{code:'IE',name:'Ireland',flag:'🇮🇪',lang:'en'},
  {code:'SG',name:'Singapore',flag:'🇸🇬',lang:'en'},{code:'MY',name:'Malaysia',flag:'🇲🇾',lang:'ms'},{code:'TH',name:'Thailand',flag:'🇹🇭',lang:'th'},
  {code:'PH',name:'Philippines',flag:'🇵🇭',lang:'en'},{code:'ID',name:'Indonesia',flag:'🇮🇩',lang:'id'},{code:'VN',name:'Vietnam',flag:'🇻🇳',lang:'vi'},
  {code:'TW',name:'Taiwan',flag:'🇹🇼',lang:'zh'},{code:'HK',name:'Hong Kong',flag:'🇭🇰',lang:'zh'},{code:'SA',name:'Saudi Arabia',flag:'🇸🇦',lang:'ar'},
  {code:'AE',name:'UAE',flag:'🇦🇪',lang:'ar'},{code:'IL',name:'Israel',flag:'🇮🇱',lang:'he'},{code:'TR',name:'Turkey',flag:'🇹🇷',lang:'tr'},
  {code:'ZA',name:'South Africa',flag:'🇿🇦',lang:'en'},{code:'NG',name:'Nigeria',flag:'🇳🇬',lang:'en'},{code:'KE',name:'Kenya',flag:'🇰🇪',lang:'en'},
  {code:'EG',name:'Egypt',flag:'🇪🇬',lang:'ar'},{code:'GH',name:'Ghana',flag:'🇬🇭',lang:'en'},{code:'PK',name:'Pakistan',flag:'🇵🇰',lang:'ur'},
  {code:'BD',name:'Bangladesh',flag:'🇧🇩',lang:'bn'},{code:'LK',name:'Sri Lanka',flag:'🇱🇰',lang:'si'},{code:'NP',name:'Nepal',flag:'🇳🇵',lang:'ne'},
  {code:'MN',name:'Mongolia',flag:'🇲🇳',lang:'mn'},{code:'PL',name:'Poland',flag:'🇵🇱',lang:'pl'},{code:'CZ',name:'Czech Republic',flag:'🇨🇿',lang:'cs'},
  {code:'RO',name:'Romania',flag:'🇷🇴',lang:'ro'},{code:'HU',name:'Hungary',flag:'🇭🇺',lang:'hu'},{code:'GR',name:'Greece',flag:'🇬🇷',lang:'el'},
  {code:'HR',name:'Croatia',flag:'🇭🇷',lang:'hr'},{code:'BG',name:'Bulgaria',flag:'🇧🇬',lang:'bg'},{code:'UA',name:'Ukraine',flag:'🇺🇦',lang:'uk'},
  {code:'TH',name:'Thailand',flag:'🇹🇭',lang:'th'},{code:'MM',name:'Myanmar',flag:'🇲🇲',lang:'my'},{code:'KH',name:'Cambodia',flag:'🇰🇭',lang:'km'},
  {code:'LA',name:'Laos',flag:'🇱🇦',lang:'lo'},{code:'PW',name:'Palau',flag:'🇵🇼',lang:'en'},{code:'GU',name:'Guam',flag:'🇬🇺',lang:'en'},
  {code:'WS',name:'Samoa',flag:'🇼🇸',lang:'sm'},{code:'TO',name:'Tonga',flag:'🇹🇴',lang:'to'},{code:'VU',name:'Vanuatu',flag:'🇻🇺',lang:'en'},
  {code:'SB',name:'Solomon Islands',flag:'🇸🇧',lang:'en'},{code:'NC',name:'New Caledonia',flag:'🇳🇨',lang:'fr'},{code:'PF',name:'French Polynesia',flag:'🇵🇫',lang:'fr'},
  {code:'CK',name:'Cook Islands',flag:'🇨🇰',lang:'en'},{code:'NU',name:'Niue',flag:'🇳🇺',lang:'en'},{code:'TV',name:'Tuvalu',flag:'🇹🇻',lang:'en'},
  {code:'KI',name:'Kiribati',flag:'🇰🇮',lang:'en'},{code:'MH',name:'Marshall Islands',flag:'🇲🇭',lang:'en'},{code:'FM',name:'Micronesia',flag:'🇫🇲',lang:'en'},
  {code:'PG',name:'Papua New Guinea',flag:'🇵🇬',lang:'en'},{code:'TL',name:'East Timor',flag:'🇹🇱',lang:'pt'},{code:'BN',name:'Brunei',flag:'🇧🇳',lang:'ms'},
];

const I18N = {
  en: { book_ride:'Book a Ride', pickup:'Pickup Location', dropoff:'Drop-off Location', search_locations:'Search Fiji locations...', book_now:'Book Now', sea_ride:'Sea Ride', land_ride:'Land Ride', vehicle_select:'Select Vehicle', price_estimate:'Price Estimate', history:'Ride History', wallet:'mPaisa Wallet', settings:'Settings', social:'Social', destinations:'Destinations', profile:'Profile', loading:'Loading...', connect:'Connect', home:'Home', logout:'Log Out', post:'Post', review:'Review', photos:'Photos', like:'Like', comment:'Comment', share:'Share', my_story:'My Story', write_review:'Write a Review', upload_photo:'Upload Photo', country_select:'Where are you from?', language_select:'Language', all_countries:'All Countries', sign_up:'Sign Up', log_in:'Log In' },
  fj: { book_ride:'Vuqa Nodra', pickup:'Vunavu Levu', dropoff:'Yaya Vinaka', search_locations:'R searching na vanua...', book_now:'Tukuna Yaga', sea_ride:'Daliga ni Moana', land_ride:'Daliga ni Vanua', vehicle_select:'Vacuvaki Ni Yaga', price_estimate:'Duvaduva Ni Sigavou', history:'Tarotaro ni Yaga', wallet:'Kato ni Vakamarama', settings:'Tauyavu', social:'Vakasocial', destinations:'Vanua Levu', profile:'Ira', loading:'Vaciri...', connect:'Yavita', home:'Vavalagi', logout:'Gone', post:'Tukuna', review:'Duvaduva', photos:'Foto', like:'Guni', comment:'Yaya', share:'Ratua', my_story:'Lolagi', write_review:'Duvaduva ni Yaga', upload_photo:'Lugunaka Foto', country_select:'O yadravu vakayasta e dua?', language_select:'Yaya', all_countries:'Dua na Vanua', sign_up:'Lagi', log_in:'Velo' },
  hi: { book_ride:'सवारी बुक करें', pickup:'पिकअप स्थान', dropoff:'ड्रॉप-ऑफ स्थान', search_locations:'स्थान खोजें...', book_now:'अभी बुक करें', sea_ride:'समुद्री सवारी', land_ride:'भूमि सवारी', vehicle_select:'वाहन चुनें', price_estimate:'कीमत अनुमान', history:'सवारी इतिहास', wallet:'बटुआ', settings:'सेटिंग्स', social:'सामाजिक', destinations:'गंतव्य', profile:'प्रोफ़ाइल', loading:'लोड हो रहा है...', connect:'जुड़ें', home:'घर', logout:'लॉग आउट', post:'पोस्ट', review:'समीक्षा', photos:'फ़ोटो', like:'पसंद', comment:'टिप्पणी', share:'साझा करें', my_story:'मेरी कहानी', write_review:'समीक्षा लिखें', upload_photo:'फ़ोटो अपलोड करें', country_select:'आप कहाँ से हैं?', language_select:'भाषा', all_countries:'सभी देश', sign_up:'साइन अप', log_in:'लॉग इन' },
  zh: { book_ride:'预约行程', pickup:'上车地点', dropoff:'下车地点', search_locations:'搜索地点...', book_now:'立即预约', sea_ride:'海上行程', land_ride:'陆地行程', vehicle_select:'选择车辆', price_estimate:'价格估算', history:'行程历史', wallet:'钱包', settings:'设置', social:'社交', destinations:'目的地', profile:'个人资料', loading:'加载中...', connect:'连接', home:'首页', logout:'退出', post:'发布', review:'评价', photos:'照片', like:'点赞', comment:'评论', share:'分享', my_story:'我的故事', write_review:'写评价', upload_photo:'上传照片', country_select:'你来自哪里？', language_select:'语言', all_countries:'所有国家', sign_up:'注册', log_in:'登录' },
  ja: { book_ride:'予約する', pickup:'乗車地点', dropoff:'降車地点', search_locations:'検索...', book_now:'今すぐ予約', sea_ride:'海上ライド', land_rIDE:'陸上ライド', vehicle_select:'車両選択', price_estimate:'料金概算', history:'履歴', wallet:'ウォレット', settings:'設定', social:'ソーシャル', destinations:'目的地', profile:'プロフィール', loading:'読込中...', connect:'接続', home:'ホーム', logout:'ログアウト', post:'投稿', review:'レビュー', photos:'写真', like:'いいね', comment:'コメント', share:'共有', my_story:'ストーリー', write_review:'レビューを書く', upload_photo:'写真をアップロード', country_select:'出身国は？', language_select:'言語', all_countries:'すべての国', sign_up:'登録', log_in:'ログイン' },
  ko: { book_ride:'예약하기', pickup:'픽업 장소', dropoff:'하차 장소', search_locations:'검색...', book_now:'지금 예약', sea_ride:'해상 rides', land_ride:'육상 rides', vehicle_select:'차량 선택', price_estimate:'가격 견적', history:'기록', wallet:'지갑', settings:'설정', social:'소셜', destinations:'여행지', profile:'프로필', loading:'로딩...', connect:'연결', home:'홈', logout:'로그아웃', post:'게시', review:'리뷰', photos:'사진', like:'좋아요', comment:'댓글', share:'공유', my_story:'내 이야기', write_review:'리뷰 쓰기', upload_photo:'사진 업로드', country_select:'어느 나라에서 왔어요?', language_select:'언어', all_countries:'모든 나라', sign_up:'가입', log_in:'로그인' },
  fr: { book_ride:'Réserver un trajet', pickup:'Lieu de ramassage', dropoff:'Lieu de dépose', search_locations:'Rechercher...', book_now:'Réserver', sea_ride:'Trajet maritime', land_ride:'Trajet terrestre', vehicle_select:'Choisir le véhicule', price_estimate:'Estimation', history:'Historique', wallet:'Portefeuille', settings:'Paramètres', social:'Social', destinations:'Destinations', profile:'Profil', loading:'Chargement...', connect:'Se connecter', home:'Accueil', logout:'Déconnexion', post:'Publier', review:'Avis', photos:'Photos', like:'Aimer', comment:'Commenter', share:'Partager', my_story:'Mon histoire', write_review:'Écrire un avis', upload_photo:'Télécharger une photo', country_select:'D\'où venez-vous?', language_select:'Langue', all_countries:'Tous les pays', sign_up:'S\'inscrire', log_in:'Connexion' },
  de: { book_ride:'Fahrt buchen', pickup:'Abholort', dropoff:'Zielort', search_locations:'Standort suchen...', book_now:'Jetzt buchen', sea_ride:'Meeresfahrt', land_ride:'Landfahrt', vehicle_select:'Fahrzeug wählen', price_estimate:'Preisschätzung', history:'Verlauf', wallet:'Geldbörse', settings:'Einstellungen', social:'Sozial', destinations:'Reiseziele', profile:'Profil', loading:'Laden...', connect:'Verbinden', home:'Startseite', logout:'Abmelden', post:'Beitrag', review:'Bewertung', photos:'Fotos', like:'Gefällt mir', comment:'Kommentar', share:'Teilen', my_story:'Meine Geschichte', write_review:'Bewertung schreiben', upload_photo:'Foto hochladen', country_select:'Woher kommen Sie?', language_select:'Sprache', all_countries:'Alle Länder', sign_up:'Registrieren', log_in:'Anmelden' },
  es: { book_ride:'Reservar viaje', pickup:'Punto de recogida', dropoff:'Punto de drop', search_locations:'Buscar...', book_now:'Reservar ahora', sea_ride:'Viaje marítimo', land_ride:'Viaje terrestre', vehicle_select:'Seleccionar vehículo', price_estimate:'Estimación de precio', history:'Historial', wallet:'Billetera', settings:'Configuración', social:'Social', destinations:'Destinos', profile:'Perfil', loading:'Cargando...', connect:'Conectar', home:'Inicio', logout:'Cerrar sesión', post:'Publicar', review:'Reseña', photos:'Fotos', like:'Me gusta', comment:'Comentar', share:'Compartir', my_story:'Mi historia', write_review:'Escribir reseña', upload_photo:'Subir foto', country_select:'¿De dónde eres?', language_select:'Idioma', all_countries:'Todos los países', sign_up:'Registrarse', log_in:'Iniciar sesión' },
  pt: { book_ride:'Reservar viagem', pickup:'Local de coleta', dropoff:'Local de entrega', search_locations:'Pesquisar...', book_now:'Reservar agora', sea_ride:'Viagem marítima', land_ride:'Viagem terrestre', vehicle_select:'Selecionar veículo', price_estimate:'Estimativa de preço', history:'Histórico', wallet:'Carteira', settings:'Configurações', social:'Social', destinations:'Destinos', profile:'Perfil', loading:'Carregando...', connect:'Conectar', home:'Início', logout:'Sair', post:'Publicar', review:'Avaliação', photos:'Fotos', like:'Curtir', comment:'Comentar', share:'Compartilhar', my_story:'Minha história', write_review:'Escrever avaliação', upload_photo:'Enviar foto', country_select:'De onde você é?', language_select:'Idioma', all_countries:'Todos os países', sign_up:'Cadastrar', log_in:'Entrar' },
  ru: { book_ride:'Забронировать', pickup:'Место посадки', dropoff:'Место высадки', search_locations:'Поиск...', book_now:'Забронировать', sea_ride:'Морская поездка', land_ride:'Наземная поездка', vehicle_select:'Выбрать авто', price_estimate:'Оценка цены', history:'История', wallet:'Кошелёк', settings:'Настройки', social:'Социальное', destinations:'Направления', profile:'Профиль', loading:'Загрузка...', connect:'Подключить', home:'Главная', logout:'Выход', post:'Публикация', review:'Отзыв', photos:'Фото', like:'Нравится', comment:'Комментарий', share:'Поделиться', my_story:'Моя история', write_review:'Написать отзыв', upload_photo:'Загрузить фото', country_select:'Откуда вы?', language_select:'Язык', all_countries:'Все страны', sign_up:'Регистрация', log_in:'Вход' },
  ar: { book_ride:'حجز رحلة', pickup:'نقطة الالتقاط', dropoff:'نقطة التسليم', search_locations:'بحث...', book_now:'احجز الآن', sea_ride:'رحلة بحرية', land_ride:'رحلة برية', vehicle_select:'اختيار المركبة', price_estimate:'تقدير السعر', history:'السجل', wallet:'المحفظة', settings:'الإعدادات', social:'اجتماعي', destinations:'الوجهات', profile:'الملف الشخصي', loading:'جاري التحميل...', connect:'اتصل', home:'الرئيسية', logout:'خروج', post:'نشر', review:'مراجعة', photos:'صور', like:'إعجاب', comment:'تعليق', share:'مشاركة', my_story:'قصتي', write_review:'كتابة مراجعة', upload_photo:'تحميل صورة', country_select:'من أين أنت؟', language_select:'اللغة', all_countries:'جميع البلدان', sign_up:'تسجيل', log_in:'دخول' },
  ms: { book_ride:'Tempah Perjalanan', pickup:'Lokasi Jemputan', dropoff:'Lokasi Turun', search_locations:'Cari lokasi...', book_now:'Tempah Sekarang', sea_ride:'Perjalanan Laut', land_ride:'Perjalanan Darat', vehicle_select:'Pilih Kenderaan', price_estimate:'Anggaran Harga', history:'Sejarah', wallet:'Dompet', settings:'Tetapan', social:'Sosial', destinations:'Destinasi', profile:'Profil', loading:'Memuatkan...', connect:'Sambung', home:'Utama', logout:'Log Keluar', post:'Siarkan', review:'Ulasan', photos:'Foto', like:'Suka', comment:'Komen', share:'Kongsi', my_story:'Cerita Saya', write_review:'Tulis Ulasan', upload_photo:'Muat Naik Foto', country_select:'Dari mana anda?', language_select:'Bahasa', all_countries:'Semua Negara', sign_up:'Daftar', log_in:'Log Masuk' },
  th: { book_ride:'จองการเดินทาง', pickup:'จุดรับ', dropoff:'จุดส่ง', search_locations:'ค้นหา...', book_now:'จองเลย', sea_ride:'เดินทางทางทะเล', land_ride:'เดินทางทางบก', vehicle_select:'เลือกรถ', price_estimate:'ประมาณราคา', history:'ประวัติ', wallet:'กระเป๋าเงิน', settings:'ตั้งค่า', social:'สังคม', destinations:'จุดหมาย', profile:'โปรไฟล์', loading:'กำลังโหลด...', connect:'เชื่อมต่อ', home:'หน้าหลัก', logout:'ออกจากระบบ', post:'โพสต์', review:'รีวิว', photos:'รูปภาพ', like:'ถูกใจ', comment:'ความคิดเห็น', share:'แชร์', my_story:'เรื่องของฉัน', write_review:'เขียนรีวิว', upload_photo:'อัปโหลดรูป', country_select:'คุณมาจากประเทศอะไร?', language_select:'ภาษา', all_countries:'ทุกประเทศ', sign_up:'สมัคร', log_in:'เข้าสู่ระบบ' },
  vi: { book_ride:'Đặt chuyến', pickup:'Điểm đón', dropoff:'Điểm trả', search_locations:'Tìm kiếm...', book_now:'Đặt ngay', sea_ride:'Chuyến biển', land_ride:'Chuyến đường bộ', vehicle_select:'Chọn xe', price_estimate:'Ước tính giá', history:'Lịch sử', wallet:'Ví', settings:'Cài đặt', social:'Xã hội', destinations:'Điểm đến', profile:'Hồ sơ', loading:'Đang tải...', connect:'Kết nối', home:'Trang chủ', logout:'Đăng xuất', post:'Đăng', review:'Đánh giá', photos:'Ảnh', like:'Thích', comment:'Bình luận', share:'Chia sẻ', my_story:'Câu chuyện của tôi', write_review:'Viết đánh giá', upload_photo:'Tải ảnh lên', country_select:'Bạn đến từ đâu?', language_select:'Ngôn ngữ', all_countries:'Tất cả quốc gia', sign_up:'Đăng ký', log_in:'Đăng nhập' },
};

let currentLang = 'en', currentCountry = 'FJ';
function t(key) { return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key; }
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = t(key);
    else el.textContent = t(key);
  });
}
function openCountrySelector() {
  const modal = document.getElementById('country-modal');
  modal.classList.remove('hidden');
  renderCountryList('');
}
function closeCountrySelector() { document.getElementById('country-modal').classList.add('hidden'); }
function renderCountryList(query) {
  const filtered = COUNTRIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.code.toLowerCase().includes(query.toLowerCase()));
  document.getElementById('country-list').innerHTML = filtered.map(c => `
    <div class="country-item ${c.code === currentCountry ? 'active' : ''}" onclick="selectCountry('${c.code}')">
      <span class="country-flag">${c.flag}</span>
      <span class="country-name">${c.name}</span>
      <span class="country-code-badge">${c.code}</span>
    </div>`).join('');
}
function selectCountry(code) {
  const country = COUNTRIES.find(c => c.code === code);
  if (!country) return;
  currentCountry = code;
  currentLang = country.lang || 'en';
  localStorage.setItem('pb_country', code);
  localStorage.setItem('pb_lang', currentLang);
  applyTranslations();
  closeCountrySelector();
  updateCountryDisplay();
}
function updateCountryDisplay() {
  const country = COUNTRIES.find(c => c.code === currentCountry);
  const el = document.getElementById('country-btn');
  if (el && country) el.textContent = `${country.flag} ${country.code}`;
}
function initCountry() {
  const saved = localStorage.getItem('pb_country');
  if (saved) { currentCountry = saved; currentLang = localStorage.getItem('pb_lang') || 'en'; }
  else {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const match = COUNTRIES.find(c => tz.toLowerCase().includes(c.code.toLowerCase()));
    if (match) { currentCountry = match.code; currentLang = match.lang; }
  }
  updateCountryDisplay();
  applyTranslations();
}

// ═══════════ SOCIAL FEED ═══════════
function openSocial() { showSection('social'); loadSocialFeed(); }
function loadSocialFeed() {
  api('/api/posts?limit=30').then(posts => {
    const el = document.getElementById('social-feed-list');
    if (!el) return;
    el.innerHTML = posts.length ? posts.map(p => {
      const photos = JSON.parse(p.photos || '[]');
      const stars = p.rating ? '⭐'.repeat(p.rating) : '';
      return `
      <div class="social-post">
        <div class="post-header">
          <div class="post-avatar">${(p.author_name||'U')[0]}</div>
          <div>
            <div class="post-author">${p.author_name || 'Anonymous'}</div>
            <div class="post-meta">${p.location_name ? '📍 '+p.location_name : ''} • ${p.created_at}</div>
          </div>
        </div>
        ${stars ? `<div class="post-rating">${stars}</div>` : ''}
        <div class="post-title">${p.title}</div>
        ${p.story ? `<div class="post-story">${p.story}</div>` : ''}
        ${photos.length ? `<div class="post-photos">${photos.map(ph => `<img src="${ph}" class="post-photo" onclick="viewPhoto('${ph}')">`).join('')}</div>` : ''}
        <div class="post-actions">
          <button onclick="likePost('${p.id}')" class="post-action-btn">❤️ ${p.likes_count || 0}</button>
          <button onclick="openComments('${p.id}')" class="post-action-btn">💬 Comment</button>
          <button onclick="sharePost('${p.id}')" class="post-action-btn">↗️ Share</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty-state"><p>No posts yet. Be the first to share your Fiji story!</p></div>';
  });
}
function openNewPost() {
  document.getElementById('new-post-modal').classList.remove('hidden');
}
function closeNewPost() { document.getElementById('new-post-modal').classList.add('hidden'); }
function submitPost() {
  const title = document.getElementById('post-title').value;
  const story = document.getElementById('post-story').value;
  const rating = parseInt(document.getElementById('post-rating').value) || 0;
  const location = document.getElementById('post-location').value;
  if (!title) { alert('Please add a title'); return; }
  api('/api/posts', { method: 'POST', body: JSON.stringify({
    user_id: state.user?.id, title, story, rating, location_name: location,
    location_id: state.pickup?.id || null, zone: state.pickup?.zone || null, photos: uploadedPhotos
  })}).then(() => { closeNewPost(); loadSocialFeed(); uploadedPhotos = []; });
}
let uploadedPhotos = [];
function handlePhotoUpload(input) {
  const files = input.files;
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedPhotos.push(e.target.result);
      renderUploadedPhotos();
    };
    reader.readAsDataURL(file);
  }
}
function capturePhoto() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
  input.onchange = () => handlePhotoUpload(input);
  input.click();
}
function renderUploadedPhotos() {
  const el = document.getElementById('uploaded-photos');
  if (!el) return;
  el.innerHTML = uploadedPhotos.map((p, i) => `
    <div class="uploaded-photo-wrap">
      <img src="${p}" class="uploaded-photo">
      <button class="remove-photo" onclick="removePhoto(${i})">×</button>
    </div>`).join('');
}
function removePhoto(i) { uploadedPhotos.splice(i, 1); renderUploadedPhotos(); }
function viewPhoto(url) { window.open(url, '_blank'); }
function likePost(id) {
  if (!state.user) return alert('Please login first');
  api(`/api/posts/${id}/like`, { method: 'POST', body: JSON.stringify({ user_id: state.user.id }) }).then(() => loadSocialFeed());
}
function sharePost(id) {
  if (navigator.share) navigator.share({ title: 'PointBreak Fiji', text: 'Check out this post!', url: window.location.href });
  else if (navigator.clipboard) { navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied!')); }
}
function openComments(postId) {
  const commentEl = document.createElement('div');
  commentEl.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center"><div style="background:#1a2332;border-radius:12px;padding:20px;width:90%;max-width:380px"><h3 style="margin:0 0 12px;color:var(--accent)">Add a Comment</h3><textarea id="prompt-comment" rows="3" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(0,180,216,0.2);border-radius:8px;padding:10px;color:#EAF6FF;font-size:.9rem;box-sizing:border-box" placeholder="Write your comment..."></textarea><div style="display:flex;gap:8px;margin-top:12px"><button onclick="this.closest(\'div[style]\').remove()" style="flex:1;padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;background:transparent;color:#94a3b8;cursor:pointer">Cancel</button><button id="prompt-submit" style="flex:1;padding:10px;border:none;border-radius:8px;background:var(--accent);color:#0a1628;font-weight:600;cursor:pointer">Post</button></div></div></div>';
  document.body.appendChild(commentEl);
  document.getElementById('prompt-submit').onclick = function() {
    const val = document.getElementById('prompt-comment').value;
    commentEl.remove();
    if (!val) return;
    api(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ user_id: state.user?.id, user_name: state.user?.name, comment: val }) }).then(() => alert('Comment added!'));
  };
  document.getElementById('prompt-comment').focus();
}

// ═══════════ DESTINATION REVIEWS ═══════════
function openDestinationReviews(locId, locName) {
  document.getElementById('dest-reviews-title').textContent = `⭐ Reviews — ${locName}`;
  api(`/api/reviews?location_id=${locId}`).then(reviews => {
    const stats = reviews.reduce((a, r) => { a.total += r.rating; a.count++; return a; }, { total: 0, count: 0 });
    const avg = stats.count ? (stats.total / stats.count).toFixed(1) : 'No reviews';
    let html = `<div class="dest-reviews-stats">Average: ${avg} ⭐ (${stats.count} reviews)</div>`;
    html += reviews.map(r => `
      <div class="dest-review-item">
        <div class="review-stars">${'⭐'.repeat(r.rating)}</div>
        <div class="review-title">${r.title || ''}</div>
        <div class="review-text">${r.review || ''}</div>
        <div class="review-meta">by ${r.author_name || 'Anonymous'} • ${r.visit_date || r.created_at}</div>
      </div>`).join('');
    if (state.user) {
      html += `
      <div class="write-review-form" style="margin-top:12px">
        <h4 style="color:var(--accent);margin-bottom:8px">Write a Review</h4>
        <div class="input-group"><label>Rating</label><select id="rev-rating"><option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="3">⭐⭐⭐</option><option value="2">⭐⭐</option><option value="1">⭐</option></select></div>
        <div class="input-group"><label>Title</label><input type="text" id="rev-title" placeholder="Review title"></div>
        <div class="input-group"><label>Your experience</label><textarea id="rev-text" rows="3" placeholder="Tell us about your visit..."></textarea></div>
        <div class="input-group"><label>Visit date</label><input type="date" id="rev-date"></div>
        <button class="btn-primary btn-full" onclick="submitReview('${locId}')">Submit Review</button>
      </div>`;
    }
    document.getElementById('dest-reviews-list').innerHTML = html;
    document.getElementById('dest-reviews-modal').classList.remove('hidden');
  });
}
function closeDestReviews() { document.getElementById('dest-reviews-modal').classList.add('hidden'); }
function submitReview(locId) {
  const rating = parseInt(document.getElementById('rev-rating').value);
  const title = document.getElementById('rev-title').value;
  const review = document.getElementById('rev-text').value;
  const visit_date = document.getElementById('rev-date').value;
  api('/api/reviews', { method: 'POST', body: JSON.stringify({
    user_id: state.user?.id, location_id: locId, user_name: state.user?.name, rating, title, review, visit_date, photos: uploadedPhotos
  })}).then(() => { closeDestReviews(); uploadedPhotos = []; alert('Review submitted!'); });
}
