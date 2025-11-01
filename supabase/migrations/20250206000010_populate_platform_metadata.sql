-- Populate platform metadata (icon_url and short_description) for all 104 platforms
-- This migration updates all platforms with logos and descriptions from Zembra website data
-- Icon URLs are from official sources or standard CDN patterns
-- Short descriptions are brief, informative summaries of each platform

-- Major Review Platforms
UPDATE platforms SET
  icon_url = 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
  short_description_en = 'The world''s most popular search engine and review platform',
  short_description_fr = 'Le moteur de recherche et plateforme d''avis la plus populaire au monde'
WHERE LOWER(name) = 'google';

UPDATE platforms SET
  icon_url = 'https://static.xx.fbcdn.net/rsrc.php/yb/h/hcUdPA6Fc7H.png',
  short_description_en = 'Social media platform with business pages and reviews',
  short_description_fr = 'Plateforme de médias sociaux avec pages d''entreprise et avis'
WHERE LOWER(name) = 'facebook';

UPDATE platforms SET
  icon_url = 'https://s3-media0.fl.yelpcdn.com/assets/srv0/developer_pages/5e749f832069/assets/img/logos/yelp_logo_150x50.png',
  short_description_en = 'Popular review platform for local businesses and restaurants',
  short_description_fr = 'Plateforme d''avis populaire pour les entreprises locales et les restaurants'
WHERE LOWER(name) = 'yelp';

UPDATE platforms SET
  icon_url = 'https://static.tacdn.com/img2/brand_refresh/Tripadvisor_lockup_horizontal_secondary_registered.svg',
  short_description_en = 'Travel review platform for hotels, restaurants, and attractions',
  short_description_fr = 'Plateforme d''avis de voyage pour hôtels, restaurants et attractions'
WHERE LOWER(name) = 'tripadvisor';

UPDATE platforms SET
  icon_url = 'https://cdn.trustpilot.com/brand-assets/4x/logo-white.svg',
  short_description_en = 'Global review platform for businesses and services',
  short_description_fr = 'Plateforme d''avis mondiale pour les entreprises et services'
WHERE LOWER(name) = 'trustpilot';

-- Travel & Hospitality Platforms
UPDATE platforms SET
  icon_url = 'https://www.airbnb.com/favicon.ico',
  short_description_en = 'Vacation rental platform with host and property reviews',
  short_description_fr = 'Plateforme de locations de vacances avec avis sur hôtes et propriétés'
WHERE LOWER(name) = 'airbnb';

UPDATE platforms SET
  icon_url = 'https://www.booking.com/favicon.ico',
  short_description_en = 'Hotel and accommodation booking platform with guest reviews',
  short_description_fr = 'Plateforme de réservation d''hôtels et d''hébergements avec avis clients'
WHERE LOWER(name) = 'booking';

UPDATE platforms SET
  icon_url = 'https://www.expedia.com/favicon.ico',
  short_description_en = 'Travel booking platform with hotel and flight reviews',
  short_description_fr = 'Plateforme de réservation de voyage avec avis sur hôtels et vols'
WHERE LOWER(name) = 'expedia';

UPDATE platforms SET
  icon_url = 'https://www.vrbo.com/favicon.ico',
  short_description_en = 'Vacation rental marketplace with property reviews',
  short_description_fr = 'Place de marché de locations de vacances avec avis sur propriétés'
WHERE LOWER(name) = 'vrbo';

UPDATE platforms SET
  icon_url = 'https://www.abritel.fr/favicon.ico',
  short_description_en = 'French vacation rental platform with property reviews',
  short_description_fr = 'Plateforme française de locations de vacances avec avis sur propriétés'
WHERE LOWER(name) = 'abritel';

UPDATE platforms SET
  icon_url = 'https://www.agoda.com/favicon.ico',
  short_description_en = 'Hotel booking platform popular in Asia with guest reviews',
  short_description_fr = 'Plateforme de réservation d''hôtels populaire en Asie avec avis clients'
WHERE LOWER(name) = 'agoda';

UPDATE platforms SET
  icon_url = 'https://www.kayak.com/favicon.ico',
  short_description_en = 'Travel search engine aggregating reviews from multiple platforms',
  short_description_fr = 'Moteur de recherche de voyage agrégeant les avis de plusieurs plateformes'
WHERE LOWER(name) = 'kayak';

UPDATE platforms SET
  icon_url = 'https://www.travelocity.com/favicon.ico',
  short_description_en = 'Travel booking site with hotel and flight reviews',
  short_description_fr = 'Site de réservation de voyage avec avis sur hôtels et vols'
WHERE LOWER(name) = 'travelocity';

UPDATE platforms SET
  icon_url = 'https://www.orbitz.com/favicon.ico',
  short_description_en = 'Travel booking platform with accommodation and activity reviews',
  short_description_fr = 'Plateforme de réservation de voyage avec avis sur hébergements et activités'
WHERE LOWER(name) = 'orbitz';

UPDATE platforms SET
  icon_url = 'https://www.bookabach.co.nz/favicon.ico',
  short_description_en = 'New Zealand vacation rental platform with property reviews',
  short_description_fr = 'Plateforme de locations de vacances néo-zélandaise avec avis sur propriétés'
WHERE LOWER(name) = 'bookabach';

UPDATE platforms SET
  icon_url = 'https://www.fewo-direkt.de/favicon.ico',
  short_description_en = 'German vacation rental platform with holiday home reviews',
  short_description_fr = 'Plateforme allemande de locations de vacances avec avis sur maisons de vacances'
WHERE LOWER(name) = 'fewo-direkt';

UPDATE platforms SET
  icon_url = 'https://www.stayz.com.au/favicon.ico',
  short_description_en = 'Australian vacation rental platform with property reviews',
  short_description_fr = 'Plateforme australienne de locations de vacances avec avis sur propriétés'
WHERE LOWER(name) = 'stayz';

UPDATE platforms SET
  icon_url = 'https://www.goibibo.com/favicon.ico',
  short_description_en = 'Indian travel booking platform with hotel and flight reviews',
  short_description_fr = 'Plateforme de réservation de voyage indienne avec avis sur hôtels et vols'
WHERE LOWER(name) = 'goibibo';

UPDATE platforms SET
  icon_url = 'https://www.makemytrip.com/favicon.ico',
  short_description_en = 'Indian travel booking platform with comprehensive reviews',
  short_description_fr = 'Plateforme de réservation de voyage indienne avec avis complets'
WHERE LOWER(name) = 'makemytrip';

-- Restaurant & Food Delivery Platforms
UPDATE platforms SET
  icon_url = 'https://www.opentable.com/favicon.ico',
  short_description_en = 'Restaurant reservation platform with diner reviews',
  short_description_fr = 'Plateforme de réservation de restaurants avec avis des clients'
WHERE LOWER(name) = 'opentable';

UPDATE platforms SET
  icon_url = 'https://www.grubhub.com/favicon.ico',
  short_description_en = 'Food delivery platform with restaurant reviews',
  short_description_fr = 'Plateforme de livraison de nourriture avec avis sur restaurants'
WHERE LOWER(name) = 'grubhub';

UPDATE platforms SET
  icon_url = 'https://www.ubereats.com/favicon.ico',
  short_description_en = 'Food delivery service with restaurant and delivery reviews',
  short_description_fr = 'Service de livraison de nourriture avec avis sur restaurants et livraisons'
WHERE LOWER(name) = 'ubereats';

UPDATE platforms SET
  icon_url = 'https://www.doordash.com/favicon.ico',
  short_description_en = 'Food delivery platform with restaurant ratings and reviews',
  short_description_fr = 'Plateforme de livraison de nourriture avec notes et avis sur restaurants'
WHERE LOWER(name) = 'doordash';

UPDATE platforms SET
  icon_url = 'https://www.thefork.com/favicon.ico',
  short_description_en = 'Restaurant booking platform with diner reviews',
  short_description_fr = 'Plateforme de réservation de restaurants avec avis des clients'
WHERE LOWER(name) = 'thefork';

UPDATE platforms SET
  icon_url = 'https://www.justeat.co.uk/favicon.ico',
  short_description_en = 'UK food delivery platform with restaurant reviews',
  short_description_fr = 'Plateforme de livraison de nourriture britannique avec avis sur restaurants'
WHERE LOWER(name) = 'justeat';

UPDATE platforms SET
  icon_url = 'https://www.lieferando.de/favicon.ico',
  short_description_en = 'German food delivery platform with restaurant reviews',
  short_description_fr = 'Plateforme de livraison de nourriture allemande avec avis sur restaurants'
WHERE LOWER(name) = 'lieferando';

UPDATE platforms SET
  icon_url = 'https://www.takeaway.com/favicon.ico',
  short_description_en = 'European food delivery platform with restaurant reviews',
  short_description_fr = 'Plateforme de livraison de nourriture européenne avec avis sur restaurants'
WHERE LOWER(name) = 'takeaway';

UPDATE platforms SET
  icon_url = 'https://www.talabat.com/favicon.ico',
  short_description_en = 'Middle Eastern food delivery platform with restaurant reviews',
  short_description_fr = 'Plateforme de livraison de nourriture du Moyen-Orient avec avis sur restaurants'
WHERE LOWER(name) = 'talabat';

UPDATE platforms SET
  icon_url = 'https://www.thuisbezorgd.nl/favicon.ico',
  short_description_en = 'Dutch food delivery platform with restaurant reviews',
  short_description_fr = 'Plateforme de livraison de nourriture néerlandaise avec avis sur restaurants'
WHERE LOWER(name) = 'thuisbezorgd';

UPDATE platforms SET
  icon_url = 'https://www.zomato.com/favicon.ico',
  short_description_en = 'Restaurant discovery and food delivery platform with reviews',
  short_description_fr = 'Plateforme de découverte de restaurants et livraison avec avis'
WHERE LOWER(name) = 'zomato';

UPDATE platforms SET
  icon_url = 'https://www.designmynight.com/favicon.ico',
  short_description_en = 'Restaurant and bar booking platform with venue reviews',
  short_description_fr = 'Plateforme de réservation de restaurants et bars avec avis sur établissements'
WHERE LOWER(name) = 'designmynight';

-- Healthcare Platforms
UPDATE platforms SET
  icon_url = 'https://www.healthgrades.com/favicon.ico',
  short_description_en = 'Healthcare provider review platform for doctors and facilities',
  short_description_fr = 'Plateforme d''avis de professionnels de la santé pour médecins et établissements'
WHERE LOWER(name) = 'healthgrades';

UPDATE platforms SET
  icon_url = 'https://www.zocdoc.com/favicon.ico',
  short_description_en = 'Medical appointment booking platform with doctor reviews',
  short_description_fr = 'Plateforme de prise de rendez-vous médicaux avec avis sur médecins'
WHERE LOWER(name) = 'zocdoc';

UPDATE platforms SET
  icon_url = 'https://www.vitals.com/favicon.ico',
  short_description_en = 'Healthcare provider review platform for medical professionals',
  short_description_fr = 'Plateforme d''avis de professionnels de la santé pour professionnels médicaux'
WHERE LOWER(name) = 'vitals';

UPDATE platforms SET
  icon_url = 'https://www.ratemds.com/favicon.ico',
  short_description_en = 'Doctor review and rating platform',
  short_description_fr = 'Plateforme d''avis et de notation de médecins'
WHERE LOWER(name) = 'ratemds';

UPDATE platforms SET
  icon_url = 'https://www.realself.com/favicon.ico',
  short_description_en = 'Plastic surgery and cosmetic procedure review platform',
  short_description_fr = 'Plateforme d''avis sur chirurgie esthétique et procédures cosmétiques'
WHERE LOWER(name) = 'realself';

UPDATE platforms SET
  icon_url = 'https://www.doctor.com/favicon.ico',
  short_description_en = 'Healthcare provider directory with patient reviews',
  short_description_fr = 'Annuaire de professionnels de la santé avec avis patients'
WHERE LOWER(name) = 'doctor';

UPDATE platforms SET
  icon_url = 'https://www.practo.com/favicon.ico',
  short_description_en = 'Indian healthcare platform with doctor and clinic reviews',
  short_description_fr = 'Plateforme de santé indienne avec avis sur médecins et cliniques'
WHERE LOWER(name) = 'practo';

UPDATE platforms SET
  icon_url = 'https://www.fertilityiq.com/favicon.ico',
  short_description_en = 'Fertility treatment review and information platform',
  short_description_fr = 'Plateforme d''avis et d''informations sur les traitements de fertilité'
WHERE LOWER(name) = 'fertilityiq';

UPDATE platforms SET
  icon_url = 'https://www.webmd.com/favicon.ico',
  short_description_en = 'Health information and provider review platform',
  short_description_fr = 'Plateforme d''informations santé et d''avis sur professionnels'
WHERE LOWER(name) = 'webmd';

UPDATE platforms SET
  icon_url = 'https://www.treatwell.co.uk/favicon.ico',
  short_description_en = 'Beauty and wellness appointment booking with reviews',
  short_description_fr = 'Réservation de rendez-vous beauté et bien-être avec avis'
WHERE LOWER(name) = 'treatwell';

-- Real Estate & Property Platforms
UPDATE platforms SET
  icon_url = 'https://www.zillow.com/favicon.ico',
  short_description_en = 'Real estate marketplace with property and agent reviews',
  short_description_fr = 'Place de marché immobilière avec avis sur propriétés et agents'
WHERE LOWER(name) = 'zillow';

UPDATE platforms SET
  icon_url = 'https://www.apartments.com/favicon.ico',
  short_description_en = 'Apartment rental platform with property reviews',
  short_description_fr = 'Plateforme de location d''appartements avec avis sur propriétés'
WHERE LOWER(name) = 'apartments-com';

UPDATE platforms SET
  icon_url = 'https://www.apartmentguide.com/favicon.ico',
  short_description_en = 'Apartment search platform with property reviews',
  short_description_fr = 'Plateforme de recherche d''appartements avec avis sur propriétés'
WHERE LOWER(name) = 'apartment-guide';

UPDATE platforms SET
  icon_url = 'https://www.apartmentratings.com/favicon.ico',
  short_description_en = 'Apartment review platform for renters',
  short_description_fr = 'Plateforme d''avis d''appartements pour locataires'
WHERE LOWER(name) = 'apartmentratings';

UPDATE platforms SET
  icon_url = 'https://www.rent.com/favicon.ico',
  short_description_en = 'Rental property search platform with reviews',
  short_description_fr = 'Plateforme de recherche de biens locatifs avec avis'
WHERE LOWER(name) = 'rent';

UPDATE platforms SET
  icon_url = 'https://www.houzz.com/favicon.ico',
  short_description_en = 'Home design and remodeling platform with contractor reviews',
  short_description_fr = 'Plateforme de design et rénovation avec avis sur entrepreneurs'
WHERE LOWER(name) = 'houzz';

-- Automotive Platforms
UPDATE platforms SET
  icon_url = 'https://www.autotrader.com/favicon.ico',
  short_description_en = 'Automotive marketplace with dealer reviews',
  short_description_fr = 'Place de marché automobile avec avis sur concessionnaires'
WHERE LOWER(name) = 'autotrader';

UPDATE platforms SET
  icon_url = 'https://www.cars.com/favicon.ico',
  short_description_en = 'Car buying and selling platform with dealer reviews',
  short_description_fr = 'Plateforme d''achat et vente de voitures avec avis sur concessionnaires'
WHERE LOWER(name) = 'cars';

UPDATE platforms SET
  icon_url = 'https://www.carvana.com/favicon.ico',
  short_description_en = 'Online car dealer with vehicle and service reviews',
  short_description_fr = 'Concessionnaire automobile en ligne avec avis sur véhicules et services'
WHERE LOWER(name) = 'carvana';

UPDATE platforms SET
  icon_url = 'https://www.carfax.com/favicon.ico',
  short_description_en = 'Vehicle history and dealer information platform',
  short_description_fr = 'Plateforme d''historique des véhicules et informations sur concessionnaires'
WHERE LOWER(name) = 'carfax';

UPDATE platforms SET
  icon_url = 'https://www.dealerrater.com/favicon.ico',
  short_description_en = 'Car dealer review and rating platform',
  short_description_fr = 'Plateforme d''avis et de notation de concessionnaires automobiles'
WHERE LOWER(name) = 'dealerrater';

UPDATE platforms SET
  icon_url = 'https://www.kbb.com/favicon.ico',
  short_description_en = 'Automotive valuation and dealer review platform',
  short_description_fr = 'Plateforme d''évaluation automobile et d''avis sur concessionnaires'
WHERE LOWER(name) = 'kelley-blue-book';

-- Legal Platforms
UPDATE platforms SET
  icon_url = 'https://www.avvo.com/favicon.ico',
  short_description_en = 'Legal services directory with lawyer reviews',
  short_description_fr = 'Annuaire de services juridiques avec avis sur avocats'
WHERE LOWER(name) = 'avvo';

UPDATE platforms SET
  icon_url = 'https://www.findlaw.com/favicon.ico',
  short_description_en = 'Legal directory with attorney reviews and ratings',
  short_description_fr = 'Annuaire juridique avec avis et notes sur avocats'
WHERE LOWER(name) = 'findlaw';

UPDATE platforms SET
  icon_url = 'https://www.lawyers.com/favicon.ico',
  short_description_en = 'Attorney directory with lawyer reviews',
  short_description_fr = 'Annuaire d''avocats avec avis sur professionnels'
WHERE LOWER(name) = 'lawyers';

-- Software & Tech Platforms
UPDATE platforms SET
  icon_url = 'https://www.capterra.com/favicon.ico',
  short_description_en = 'Software review and comparison platform',
  short_description_fr = 'Plateforme d''avis et de comparaison de logiciels'
WHERE LOWER(name) = 'capterra';

UPDATE platforms SET
  icon_url = 'https://www.g2.com/favicon.ico',
  short_description_en = 'Business software review platform',
  short_description_fr = 'Plateforme d''avis de logiciels professionnels'
WHERE LOWER(name) = 'clutch';

UPDATE platforms SET
  icon_url = 'https://www.softwareadvice.com/favicon.ico',
  short_description_en = 'Software recommendation and review platform',
  short_description_fr = 'Plateforme de recommandation et d''avis de logiciels'
WHERE LOWER(name) = 'softwareadvice';

UPDATE platforms SET
  icon_url = 'https://www.trustradius.com/favicon.ico',
  short_description_en = 'B2B software review platform',
  short_description_fr = 'Plateforme d''avis de logiciels B2B'
WHERE LOWER(name) = 'trustradius';

UPDATE platforms SET
  icon_url = 'https://www.producthunt.com/favicon.ico',
  short_description_en = 'Product discovery platform with user reviews',
  short_description_fr = 'Plateforme de découverte de produits avec avis utilisateurs'
WHERE LOWER(name) = 'producthunt';

UPDATE platforms SET
  icon_url = 'https://store.steampowered.com/favicon.ico',
  short_description_en = 'Video game distribution platform with game reviews',
  short_description_fr = 'Plateforme de distribution de jeux vidéo avec avis sur jeux'
WHERE LOWER(name) = 'steam';

UPDATE platforms SET
  icon_url = 'https://www.apple.com/app-store/favicon.ico',
  short_description_en = 'iOS app store with app ratings and reviews',
  short_description_fr = 'App Store iOS avec notes et avis sur applications'
WHERE LOWER(name) = 'app-store';

UPDATE platforms SET
  icon_url = 'https://play.google.com/favicon.ico',
  short_description_en = 'Android app store with app ratings and reviews',
  short_description_fr = 'Google Play avec notes et avis sur applications'
WHERE LOWER(name) = 'google-play';

UPDATE platforms SET
  icon_url = 'https://alternativeto.net/favicon.ico',
  short_description_en = 'Software alternative discovery platform with reviews',
  short_description_fr = 'Plateforme de découverte d''alternatives logicielles avec avis'
WHERE LOWER(name) = 'alternativeto';

-- Financial Services Platforms
UPDATE platforms SET
  icon_url = 'https://www.creditkarma.com/favicon.ico',
  short_description_en = 'Financial services platform with credit and product reviews',
  short_description_fr = 'Plateforme de services financiers avec avis sur crédit et produits'
WHERE LOWER(name) = 'creditkarma';

UPDATE platforms SET
  icon_url = 'https://www.lendingtree.com/favicon.ico',
  short_description_en = 'Loan comparison platform with lender reviews',
  short_description_fr = 'Plateforme de comparaison de prêts avec avis sur prêteurs'
WHERE LOWER(name) = 'lendingtree';

UPDATE platforms SET
  icon_url = 'https://www.supermoney.com/favicon.ico',
  short_description_en = 'Financial product comparison and review platform',
  short_description_fr = 'Plateforme de comparaison et d''avis de produits financiers'
WHERE LOWER(name) = 'supermoney';

-- Business & Corporate Platforms
UPDATE platforms SET
  icon_url = 'https://www.glassdoor.com/favicon.ico',
  short_description_en = 'Employer review and job search platform',
  short_description_fr = 'Plateforme d''avis employeurs et recherche d''emploi'
WHERE LOWER(name) = 'glassdoor';

UPDATE platforms SET
  icon_url = 'https://www.indeed.com/favicon.ico',
  short_description_en = 'Job search platform with company reviews',
  short_description_fr = 'Plateforme de recherche d''emploi avec avis sur entreprises'
WHERE LOWER(name) = 'indeed';

UPDATE platforms SET
  icon_url = 'https://www.linkedin.com/favicon.ico',
  short_description_en = 'Professional network with company pages and reviews',
  short_description_fr = 'Réseau professionnel avec pages entreprise et avis'
WHERE LOWER(name) = 'linkedin';

UPDATE platforms SET
  icon_url = 'https://www.gartner.com/favicon.ico',
  short_description_en = 'Technology research and consulting firm reviews',
  short_description_fr = 'Avis sur entreprise de recherche et conseil technologique'
WHERE LOWER(name) = 'gartner';

UPDATE platforms SET
  icon_url = 'https://www.bbb.org/favicon.ico',
  short_description_en = 'Business accreditation and complaint review platform',
  short_description_fr = 'Plateforme d''accréditation et d''avis de plaintes d''entreprises'
WHERE LOWER(name) = 'bbb';

UPDATE platforms SET
  icon_url = 'https://www.consumeraffairs.com/favicon.ico',
  short_description_en = 'Consumer review platform for products and services',
  short_description_fr = 'Plateforme d''avis consommateurs pour produits et services'
WHERE LOWER(name) = 'consumeraffairs';

UPDATE platforms SET
  icon_url = 'https://www.sitejabber.com/favicon.ico',
  short_description_en = 'Online business review and verification platform',
  short_description_fr = 'Plateforme d''avis et de vérification d''entreprises en ligne'
WHERE LOWER(name) = 'sitejabber';

UPDATE platforms SET
  icon_url = 'https://www.resellerratings.com/favicon.ico',
  short_description_en = 'E-commerce and retailer review platform',
  short_description_fr = 'Plateforme d''avis sur e-commerce et détaillants'
WHERE LOWER(name) = 'resellerratings';

-- Social Media Platforms
UPDATE platforms SET
  icon_url = 'https://www.instagram.com/favicon.ico',
  short_description_en = 'Visual social media platform with business profiles',
  short_description_fr = 'Plateforme de médias sociaux visuels avec profils entreprise'
WHERE LOWER(name) = 'instagram';

UPDATE platforms SET
  icon_url = 'https://www.tiktok.com/favicon.ico',
  short_description_en = 'Short-form video platform with business accounts',
  short_description_fr = 'Plateforme de vidéos courtes avec comptes professionnels'
WHERE LOWER(name) = 'tiktok';

UPDATE platforms SET
  icon_url = 'https://www.reddit.com/favicon.ico',
  short_description_en = 'Social news platform with discussion threads',
  short_description_fr = 'Plateforme d''actualités sociales avec fils de discussion'
WHERE LOWER(name) = 'reddit';

-- Local Business Directories
UPDATE platforms SET
  icon_url = 'https://www.bing.com/favicon.ico',
  short_description_en = 'Search engine with local business listings and reviews',
  short_description_fr = 'Moteur de recherche avec annuaires d''entreprises locales et avis'
WHERE LOWER(name) = 'bing';

UPDATE platforms SET
  icon_url = 'https://www.apple.com/maps/favicon.ico',
  short_description_en = 'Apple Maps with business listings and reviews',
  short_description_fr = 'Apple Maps avec annuaires d''entreprises et avis'
WHERE LOWER(name) = 'apple-maps';

UPDATE platforms SET
  icon_url = 'https://ads.google.com/local-services/favicon.ico',
  short_description_en = 'Google Local Services Ads with provider reviews',
  short_description_fr = 'Google Local Services Ads avec avis sur prestataires'
WHERE LOWER(name) = 'google-local-services-ads';

UPDATE platforms SET
  icon_url = 'https://www.yellowpages.com/favicon.ico',
  short_description_en = 'Traditional business directory with reviews',
  short_description_fr = 'Annuaire traditionnel d''entreprises avec avis'
WHERE LOWER(name) = 'yellow-pages';

UPDATE platforms SET
  icon_url = 'https://www.pagesjaunes.fr/favicon.ico',
  short_description_en = 'French business directory with business reviews',
  short_description_fr = 'Pages Jaunes avec avis sur entreprises'
WHERE LOWER(name) = 'pagesjaunes';

UPDATE platforms SET
  icon_url = 'https://www.yell.com/favicon.ico',
  short_description_en = 'UK business directory with reviews',
  short_description_fr = 'Annuaire d''entreprises britannique avec avis'
WHERE LOWER(name) = 'yell';

UPDATE platforms SET
  icon_url = 'https://www.justdial.com/favicon.ico',
  short_description_en = 'Indian local search and directory with reviews',
  short_description_fr = 'Recherche locale et annuaire indien avec avis'
WHERE LOWER(name) = 'justdial';

UPDATE platforms SET
  icon_url = 'https://foursquare.com/favicon.ico',
  short_description_en = 'Location discovery platform with venue reviews',
  short_description_fr = 'Plateforme de découverte de lieux avec avis sur établissements'
WHERE LOWER(name) = 'foursquare';

UPDATE platforms SET
  icon_url = 'https://www.citysearch.com/favicon.ico',
  short_description_en = 'Local business directory with reviews',
  short_description_fr = 'Annuaire d''entreprises locales avec avis'
WHERE LOWER(name) = 'citysearch';

UPDATE platforms SET
  icon_url = 'https://www.insiderpages.com/favicon.ico',
  short_description_en = 'Local business review platform',
  short_description_fr = 'Plateforme d''avis d''entreprises locales'
WHERE LOWER(name) = 'insiderpages';

-- Home Services Platforms
UPDATE platforms SET
  icon_url = 'https://www.angi.com/favicon.ico',
  short_description_en = 'Home services marketplace with contractor reviews',
  short_description_fr = 'Place de marché de services à domicile avec avis sur entrepreneurs'
WHERE LOWER(name) = 'angi';

UPDATE platforms SET
  icon_url = 'https://www.homeadvisor.com/favicon.ico',
  short_description_en = 'Home improvement contractor review platform',
  short_description_fr = 'Plateforme d''avis d''entrepreneurs en rénovation'
WHERE LOWER(name) = 'homeadvisor';

-- Education Platforms
UPDATE platforms SET
  icon_url = 'https://www.greatschools.org/favicon.ico',
  short_description_en = 'School ratings and parent review platform',
  short_description_fr = 'Plateforme de notes d''écoles et d''avis de parents'
WHERE LOWER(name) = 'greatschools';

UPDATE platforms SET
  icon_url = 'https://www.niche.com/favicon.ico',
  short_description_en = 'School and college review platform',
  short_description_fr = 'Plateforme d''avis sur écoles et universités'
WHERE LOWER(name) = 'niche';

-- E-commerce Platforms
UPDATE platforms SET
  icon_url = 'https://www.etsy.com/favicon.ico',
  short_description_en = 'Handmade and vintage marketplace with seller reviews',
  short_description_fr = 'Place de marché d''articles faits main et vintage avec avis vendeurs'
WHERE LOWER(name) = 'etsy';

UPDATE platforms SET
  icon_url = 'https://www.target.com/favicon.ico',
  short_description_en = 'Retail chain with product reviews',
  short_description_fr = 'Chaîne de distribution avec avis produits'
WHERE LOWER(name) = 'target';

UPDATE platforms SET
  icon_url = 'https://www.flipkart.com/favicon.ico',
  short_description_en = 'Indian e-commerce platform with product reviews',
  short_description_fr = 'Plateforme e-commerce indienne avec avis produits'
WHERE LOWER(name) = 'flipkart';

UPDATE platforms SET
  icon_url = 'https://www.bol.com/favicon.ico',
  short_description_en = 'Dutch e-commerce platform with product reviews',
  short_description_fr = 'Plateforme e-commerce néerlandaise avec avis produits'
WHERE LOWER(name) = 'bol';

UPDATE platforms SET
  icon_url = 'https://www.productreview.com.au/favicon.ico',
  short_description_en = 'Australian product review platform',
  short_description_fr = 'Plateforme d''avis produits australienne'
WHERE LOWER(name) = 'productreview';

UPDATE platforms SET
  icon_url = 'https://www.smythstoys.com/favicon.ico',
  short_description_en = 'Toy retailer with product reviews',
  short_description_fr = 'Détaillant de jouets avec avis produits'
WHERE LOWER(name) = 'smyths-toys';

-- Specialized Platforms
UPDATE platforms SET
  icon_url = 'https://www.goodreads.com/favicon.ico',
  short_description_en = 'Book review and social reading platform',
  short_description_fr = 'Plateforme d''avis de livres et lecture sociale'
WHERE LOWER(name) = 'goodreads';

UPDATE platforms SET
  icon_url = 'https://www.influenster.com/favicon.ico',
  short_description_en = 'Product review and influencer platform',
  short_description_fr = 'Plateforme d''avis produits et d''influenceurs'
WHERE LOWER(name) = 'influenster';

UPDATE platforms SET
  icon_url = 'https://www.theknot.com/favicon.ico',
  short_description_en = 'Wedding planning platform with vendor reviews',
  short_description_fr = 'Plateforme de planification de mariage avec avis prestataires'
WHERE LOWER(name) = 'the-knot';

UPDATE platforms SET
  icon_url = 'https://www.weddingwire.com/favicon.ico',
  short_description_en = 'Wedding vendor directory with reviews',
  short_description_fr = 'Annuaire de prestataires de mariage avec avis'
WHERE LOWER(name) = 'weddingwire';

UPDATE platforms SET
  icon_url = 'https://classpass.com/favicon.ico',
  short_description_en = 'Fitness class booking platform with studio reviews',
  short_description_fr = 'Plateforme de réservation de cours de fitness avec avis studios'
WHERE LOWER(name) = 'classpass';

-- Default fallback for any platforms not explicitly listed above
-- Use platform base_url or display_name for generic icon if no specific URL found
UPDATE platforms 
SET 
  icon_url = COALESCE(icon_url, base_url || '/favicon.ico'),
  short_description_en = COALESCE(short_description_en, 'Review and rating platform for ' || display_name),
  short_description_fr = COALESCE(short_description_fr, 'Plateforme d''avis et de notation pour ' || display_name)
WHERE icon_url IS NULL OR short_description_en IS NULL;
