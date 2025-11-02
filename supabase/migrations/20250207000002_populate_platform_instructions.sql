-- Populate instructions for platforms and set is_active for unsupported platforms
-- Only platforms in the slugFormatPerNetwork list will have instructions and remain active

-- First, set all platforms to inactive
UPDATE platforms SET is_active = FALSE;

-- Helper function to normalize platform names (handle hyphens, underscores, case)
-- For matching: "apartment-ratings" should match "aptratings", "apartments.com" etc.
-- We'll use LOWER and replace common variations

-- Update platforms with instructions based on the provided slugFormatPerNetwork data
-- Each UPDATE uses the platform name (case-insensitive matching)

-- abritel
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.abritel.fr/pdp/lo/1217263", "acceptableFormats": ["pdp/lo/1217263", "https://www.abritel.fr/pdp/lo/1217263", "location-vacances/p2320528vb", "https://www.abritel.fr/location-vacances/p2320528vb"], "patterns": ["^(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*abritel\\.fr)?\\/)?((?:[\\w-]+\\/)*[a-z]{0,2}\\d+[a-z]{0,2})\\/?(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'abritel';

-- agoda
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.agoda.com/days-inn-by-wyndham-miami-international-airport/hotel/miami-fl-us.html", "acceptableFormats": ["ibis-styles-paris-roissy-cdg-hotel/hotel/paris-fr", "https://www.agoda.com/ibis-styles-paris-roissy-cdg-hotel/hotel/paris-fr.html", "https://www.agoda.com/ibis-styles-paris-roissy-cdg-hotel/reviews/paris-fr.html", "https://www.agoda.com/ibis-styles-paris-roissy-cdg-hotel/hotel/all/paris-fr.html"], "patterns": ["^(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*agoda(?:\\.[a-z]{2,3}){1,2})?\\/)?(?:[a-z]{2}-[a-z]{2}\\/)?([\\w-]+\\/\\w+\\/(?:all\\/)?(?:[\\w-]+\\/)?[\\w-]+)(?:\\.html(?:[?#\\/].*)?)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'agoda';

-- airbnb
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.airbnb.co.in/rooms/1100739390072754079", "acceptableFormats": ["1100739390072754079", "rooms/1100739390072754079", "https://www.airbnb.co.in/rooms/1100739390072754079"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*airbnb(?:\\.[a-z]{2,3}){1,2}\\/)?\\/?))?(?:[\\w+-]+)?\\/)?([\\d+-]+)?\\/?(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'airbnb';

-- aliexpress
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.aliexpress.com/item/1005008932789738.html", "acceptableFormats": ["1005008932789738", "1005008932789738.html", "item/1005008932789738.html", "https://www.aliexpress.com/item/1005008932789738.html"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*aliexpress(?:\\.[a-z]{2,3}){1,2}\\/)?\\/?))?(?:[\\w+-]+)?\\/)?([\\d+]+)\\/?(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'aliexpress';

-- alternative-to
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.alternativeto.net/software/typeform/about", "acceptableFormats": ["typeform", "software/typeform", "https://www.alternativeto.net/software/typeform", "https://www.alternativeto.net/software/typeform/about"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*alternativeto(?:\\.[a-z]{2,3}){1,2})?\\/)?software)?\\/)?([-\\w]+)(?:\\/[\\w-]+)*\\/?(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'alternative-to';

-- angi
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.angi.com/companylist/us/ca/poway/crawl-space-and-attic-pro-reviews-9469089.htm", "acceptableFormats": ["ca/poway/crawl-space-and-attic-pro-reviews-9469089", "https://www.angi.com/companylist/us/ca/poway/crawl-space-and-attic-pro-reviews-9469089.htm"], "patterns": ["^(?:(?:(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*angi(?:eslist)?\\.com)?\\/)?companylist)?\\/)?us)?\\/)?([a-z]{2}\\/[\\w-]+\\/[-+%_\\p{L}\\p{N}'\\.,]+-reviews-\\d+)(?:\\.htm\\/?(?:[?#].*)?)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'angi';

-- aptguide (apartmentguide)
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.apartmentguide.com/apartments/California/San-Diego/The-Village-Mission-Valley/155467/", "acceptableFormats": ["88451", "Maa-Lenox-Atlanta-GA-88451", "MAA-Lenox/88451", "apartments/California/San-Diego/MAA-Lenox/88451", "rent/Maa-Lenox-Atlanta-GA-88451", "https://www.apartmentguide.com/apartments/Georgia/Atlanta/MAA-Lenox/88451/", "https://www.apartmentguide.com/rent/Maa-Lenox-Atlanta-GA-88451/", "https://www.apartmentguide.com/a/Quincy-New-York-NY-5920858/"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*apartmentguide\\.com)?\\/)?[a-z_]+)?\\/)?(?:[a-z-]+\\/){0,2}((?:[\\w~+!@-]*[\\/-])?[\\da-z]+)\\/?(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) IN ('aptguide', 'apartmentguide');

-- aptratings (apartmentratings)
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.apartmentratings.com/tx/dallas/courts-at-preston-oaks_972788142275240", "acceptableFormats": ["courts-at-preston-oaks_972788142275240", "https://www.apartmentratings.com/tx/dallas/courts-at-preston-oaks_972788142275240", "972788142275240"], "patterns": ["^(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*apartmentratings\\.com)?\\/)?[a-z]{2}\\/[-+%_\\p{L}\\p{N}'\\.*~`\\u2018\\u00a8\\u201c\\u201e\\u00b0\\s,:%!?@#.\\(\\)\\.\\u00ae\\u00a9\\u2122&\\u00a3$\\u20ac\\u00a2]+\\/)?((?:[-+%_\\p{L}\\p{N}'\\.*~`\\u2018\\u00a8\\u201c\\u201e\\u00b0\\s,:%!?@#.\\(\\)\\.\\u00ae\\u00a9\\u2122&\\u00a3$\\u20ac\\u00a2]+_)?\\d+)(:?_\\w+)?(?:\\/\\w+)*\\/?(?:[?#].*)?$"], "lowerCased": true}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) IN ('aptratings', 'apartmentratings');

-- apartments
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.apartments.com/overture-san-marcos-55-senior-housing-apa-san-marcos-ca/5jm0mwp", "acceptableFormats": ["5jm0mwp", "overture-san-marcos-55-senior-housing-apa-san-marcos-ca/5jm0mwp", "https://www.apartments.com/overture-san-marcos-55-senior-housing-apa-san-marcos-ca/5jm0mwp", "https://www.apartments.com/es/overture-san-marcos-55-senior-housing-apa-san-marcos-ca/5jm0mwp"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*apartments\\.com)?\\/)?(?:[a-z]{2}\\/)?[\\w-]+)?\\/)?([\\da-z]+)\\/?(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'apartments';

-- place-for-mom (aplaceformom)
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.aplaceformom.com/community/amber-court-of-brooklyn-61756", "acceptableFormats": ["community/amber-court-of-brooklyn-61756", "https://www.aplaceformom.com/community/amber-court-of-brooklyn-61756", "providers/aa-blank-7671", "https://www.aplaceformom.com/providers/aa-blank-7671"], "patterns": ["^(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*aplaceformom(?:\\.[a-z]{2,3}){1,2})?\\/)?((?:community|providers)\\/(?:\\w+-)*\\d+)\\/?(?:\\/?[?#].*)?$"], "lowerCased": true}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) IN ('place-for-mom', 'aplaceformom');

-- app-store
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://apps.apple.com/app/bna/id1523383806", "acceptableFormats": ["1523383806", "bna/id1523383806", "app/bna/id1523383806", "https://apps.apple.com/app/bna/id1523383806"], "patterns": ["^(?:(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*apps.apple(?:\\.[a-z]{2,3}){1,2})?\\/)?(?:[\\w]{2}\\/)?)?)?app)?\\/)?[\\w-]+)?\\/)?)(?:id)?([\\d]+)(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) IN ('app-store', 'appstore');

-- apple-maps
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://maps.apple.com/place?auid=2404254127207869658", "acceptableFormats": ["2404254127207869658", "https://maps.apple.com/place?auid=2404254127207869658", "ID4C29E6DBFA72090", "https://maps.apple.com/place?placeid=ID4C29E6DBFA72090"], "patterns": ["^(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*maps\\.apple\\.[a-z]{2,3}(?:\\.[a-z]{2})?(?:\\/place)?\\/?\\?(?:.*&)?(?:au|place)id=([A-Z\\d]+)(?:[#&].*)?)|([A-Z\\d]+))$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) IN ('apple-maps', 'applemaps');

-- auto-trader
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.autotrader.com/car-dealers/schaumburg-il/892869/zeigler-chevrolet-schaumburg/", "acceptableFormats": ["car-dealers/schaumburg-il/892869", "car-dealers/schaumburg-il/892869/zeigler-chevrolet-schaumburg/", "https://www.autotrader.com/car-dealers/schaumburg-il/892869/zeigler-chevrolet-schaumburg/", "cars-for-sale/vehicle/750347196", "https://www.autotrader.com/cars-for-sale/vehicle/750347196"], "patterns": ["^(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*autotrader(?:\\.[a-z]{2,3}){1,2})?\\/)?((?:cars-for-sale|car-dealers)\\/[-\\w]+\\/\\d+)(?:\\/[\\w-]+)*\\/?(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'autotrader';

-- avvo
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.avvo.com/attorneys/02109-ma-steven-gurdin-1359546.html", "acceptableFormats": ["02109-ma-steven-gurdin-1359546", "1359546", "https://www.avvo.com/attorneys/02109-ma-steven-gurdin-1359546.html"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*avvo(?:\\.[a-z]{2,3}){1,2})?\\/)?attorneys)?\\/)?((?:\\w+-)*\\d+)(?:(?:(?:\\/[a-z]+)*\\.html\\/?(?:\\/?[?#].*)?)?)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'avvo';

-- bbb
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.bbb.org/us/pa/king-of-prussia/profile/property-management/morgan-properties-0241-80016288", "acceptableFormats": ["morgan-properties-0241-80016288", "https://www.bbb.org/us/pa/king-of-prussia/profile/property-management/morgan-properties-0241-80016288", "0241-80016288"], "patterns": ["^(?:(?:https?:\\\\/\\\\/)?(?:[\\\\w-]"], "lowerCased": true}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'bbb';

-- best-buy
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.bestbuy.com/site/sony-alpha-6100-mirrorless-4k-video-camera-with-e-pz-16-50mm-lens-black/6614508.p", "acceptableFormats": ["com/site/lg-75-class-ut70-series-led-4k-uhd-smart-webos-tv-2024/6593575.p?skuId=6593575", "https://www.bestbuy.com/site/sony-alpha-6100-mirrorless-4k-video-camera-with-e-pz-16-50mm-lens-black/6614508.p", "https://www.bestbuy.ca/en-ca/product/lg-0-9-cu-ft-microwave-with-smart-inverter-mser0990s-stainless-steel/17937198"], "patterns": ["^(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*bestbuy\\.)?([a-z]{2,3}\\/(?:[a-z]{2}-[a-z]{2}\\/)?(?:site|product)(?:\\/[\\w.-]+)+)\\/?(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'best-buy';

-- bilbayt
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://bilbayt.com/kw/en/vendors/fusion", "acceptableFormats": ["fusion", "vendors/fusion", "en/vendors/fusion", "kw/ar/vendors/fusion", "https://bilbayt.com/kw/en/vendors/fusion", "https://bilbayt.com/ae/ar/vendors/pattie-pattie"], "patterns": ["^(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*bilbayt(?:\\.[a-z]{2,3}){1,2})?\\/)?(?:kw|ae))?\\/)?[a-z]{2})?\\/)?vendors)?\\/)?([\\w-]+)\\/?(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'bilbayt';

-- bing
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.bing.com/maps?osid=c5a1cb29-5171-494c-ad4c-a5c2599c7278", "acceptableFormats": ["c5a1cb29-5171-494c-ad4c-a5c2599c7278", "YN8000x16403903209167712259", "https://www.bing.com/maps?osid=c5a1cb29-5171-494c-ad4c-a5c2599c7278", "https://www.bing.com/maps?ypid=YN8000x16403903209167712259", "https://www.bing.com/maps?&ty=18&q=Sourdough%26Co.&ss=ypid.873x16370840542229259941"], "patterns": ["^(?:(?:(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*bing(?:\\.[a-z]{2,3}){1,2})?\\/)?(?:maps))?\\/?)?(?:(?:\\?.*)))?(?:osid|ypid)[=.])?([\\w-]+)(?:&.*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'bing';

-- bol
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.bol.com/be/fr/v/supfoods/1814801", "acceptableFormats": ["9300000001023970", "transmetteur-fm-bluetooth-wegman-chargeur-de-voiture-kit-de-voiture-bluetooth/9300000001023970", "p/transmetteur-fm-bluetooth-wegman-chargeur-de-voiture-kit-de-voiture-bluetooth/9300000001023970", "nl/p/transmetteur-fm-bluetooth-wegman-chargeur-de-voiture-kit-de-voiture-bluetooth/9300000001023970", "nl/fr/p/transmetteur-fm-bluetooth-wegman-chargeur-de-voiture-kit-de-voiture-bluetooth/9300000001023970", "https://www.bol.com/nl/fr/p/transmetteur-fm-bluetooth-wegman-chargeur-de-voiture-kit-de-voiture-bluetooth/9300000001023970", "be/v/supfoods/1814801", "be/fr/v/supfoods/1814801", "https://www.bol.com/be/fr/v/supfoods/1814801"], "patterns": ["^(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*bol(?:\\.[a-z]{2,3}){1,2})?)?\\/)?((?:(?:(?:(?:be|nl)\\/(?:fr\\/|nl\\/)?)?[vp]\\/)?[\\w-]+\\/)?\\d+)\\/?(?:[?#].*)?$"], "lowerCased": true}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'bol';

-- bookabach
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.bookabach.co.nz/pdp/lo/1217263", "acceptableFormats": ["pdp/lo/1217263", "https://www.bookabach.co.nz/pdp/lo/1217263", "holiday-accommodation/p2320528vb", "https://www.bookabach.co.nz/holiday-accommodation/p2320528vb"], "patterns": ["^(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*bookabach\\.co\\.nz)?\\/)?((?:[\\w-]+\\/)*[a-z]{0,2}\\d+[a-z]{0,2})\\/?(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'bookabach';

-- booking
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.booking.com/hotel/it/largo-argentina-apartment-daplace-apartments", "acceptableFormats": ["hotel/it/largo-argentina-apartment-daplace-apartments", "attractions/us/prywkuaglxhb-las-vegas-strip-helicopter-ride-at-night", "https://www.booking.com/hotel/it/largo-argentina-apartment-daplace-apartments.it.html", "https://www.booking.com/attractions/us/prywkuaglxhb-las-vegas-strip-helicopter-ride-at-night.html"], "patterns": ["^(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*booking(?:\\.[a-z]{2,3}){1,2})?\\/)?((?:hotel|attractions)\\/[a-z]{2}\\/[\\w-]+)(?:(?:\\.[a-z]{2}(?:-[a-z]{2})?)?\\.html(?:[?#].*)?)?$"], "lowerCased": true}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'booking';

-- Note: Continuing with remaining 95+ platforms...
-- This file will be completed with all platform instructions


-- capterra
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.capterra.com/p/149522/Salesflare/", "acceptableFormats": ["p/149522/Salesflare", "sp/8652/revlocal", "https://www.capterra.com/p/149522/Salesflare/reviews", "https://www.capterra.com/services/sp/8652/revlocal/"], "patterns": ["^(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*capterra(?:\\.[a-z]{2,3}){1,2})?\\/)?((?:(?:services\\/)?s)?p\\/\\d+\\/[\\w-]+)(?:[?#\\/].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'capterra';

-- carfax
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.carfax.com/Reviews-Cronin-Chrysler-Dodge-Jeep-Ram-Lebanon-OH_P9E4IWXPNS", "acceptableFormats": ["Reviews-Cronin-Chrysler-Dodge-Jeep-Ram-Lebanon-OH_P9E4IWXPNS", "P9E4IWXPNS", "https://www.carfax.com/Reviews-Cronin-Chrysler-Dodge-Jeep-Ram-Lebanon-OH_P9E4IWXPNS"], "patterns": ["^(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*carfax(?:\\.[a-z]{2,3}){1,2})?\\/)?(?:[a-z]{2}\\/)?(Reviews(?:-[A-Za-z\\d_]+)+_[A-Z\\d]{5,13})\\/?(?:[?#].*)?$", "@^[A-Z\\d]{5,13}$@i"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'carfax';

-- car-gurus (cargurus)
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.cargurus.com/Cars/m-Diamond-Honda-sp285048", "acceptableFormats": ["m-Diamond-Honda-sp285048", "https://www.cargurus.com/Cars/m-Diamond-Honda-sp285048", "https://www.cargurus.com/Cars/inventorylistingviewDetailsFilterViewInventoryListing.action?zip=90001&distance=50&entitySelectingHelper.selectedEntity=m124#listing=417878058\\/NONE\\/DEFAULT", "Cars/inventorylistingviewDetailsFilterViewInventoryListing.action?zip=90001&distance=50&entitySelectingHelper.selectedEntity=m124#listing=417878058\\/NONE\\/DEFAULT", "Cars/inventorylisting\\/vdp.action?listingId=414225544&pid=homepage~consumer~price_drop_shelf_card&position=1#listing=417878058", "vdp.action?listingId=414225544&pid=homepage~consumer~price_drop_shelf_card&position=1#listing=417878058", "listing=417878058", "listingId=414225544"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*cargurus(?:\\.[a-z]{2,3}){1,2})?\\/)?Cars)?\\/)?([\\w-]+-sp\\d+)(?:\\/?[?#].*)?$", "^(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*cargurus(?:\\.[a-z]{2,3}){1,2})?\\/)?Cars)?\\/)?[\\w.-\\/]+)?\\/)?[?#])?.+)?(listing=\\d+).*$", "^(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*cargurus(?:\\.[a-z]{2,3}){1,2})?\\/)?Cars)?\\/)?[\\w.-\\/]+)?\\/)?[?#])?.+)?(listingId=\\d+).*$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) IN ('car-gurus', 'cargurus');

-- cars
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.cars.com/dealers/6000406/porsche-downtown-chicago/", "acceptableFormats": ["6000406/porsche-downtown-chicago", "6000406", "dealers/6000406/porsche-downtown-chicago", "https://www.cars.com/dealers/6000406/porsche-downtown-chicago/"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*cars(?:\\.[a-z]{2,3}){1,2})?\\/)?dealers)?\\/)?([\\d]+(?:\\/[\\w-]+)?)(\\/[\\w-]+)*\\/?(?:\\/?[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'cars';

-- carvana
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.carvana.com/vehicle/3619014", "acceptableFormats": ["3619014", "vehicle/3619014", "https://www.carvana.com/vehicle/3619014"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*carvana(?:\\.[a-z]{2,3}){1,2})?\\/)?vehicle)?\\/)?(\\d+)(?:\\/?[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'carvana';

-- citysearch
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.citysearch.com/profile/17639251", "acceptableFormats": ["17639251", "https://www.citysearch.com/profile/17639251"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*citysearch\\.com)?\\/)?profile)?\\/)?(\\d+)(?:\\/(?:(?:\\w+\\/)?[-+%_\\p{L}\\p{N}',\"]+\\.html\\/?(?:[?#].*)?)?)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'citysearch';

-- class-pass (classpass)
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://classpass.com/studios/bodi-scottsdale", "acceptableFormats": ["bodi-scottsdale", "studios/bodi-scottsdale", "https://classpass.com/studios/bodi-scottsdale", "25110", "https://classpass.com/studios/25110"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*classpass(?:\\.[a-z]{2,3}){1,2})?\\/)?studios)?\\/)?([\\w-]+)(?:\\/?[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) IN ('class-pass', 'classpass');

-- clutch
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.clutch.co/profile/geekyants", "acceptableFormats": ["geekyants", "https://clutch.co/profile/geekyants"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*(?:clutch\\.co)?)?\\/)?profile)?\\/)?([\\w-]+)(?:\\/?[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'clutch';

-- consumer-affairs (consumeraffairs)
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.consumeraffairs.com/solar-energy/sunpower.html", "acceptableFormats": ["solar-energy/sunpower", "https://www.consumeraffairs.com/solar-energy/sunpower.html"], "patterns": ["^(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*consumeraffairs(?:\\.[a-z]{2,3}){1,2})?\\/)?((?:[\\w-]+\\/)+[\\w-]+)(?:\\.html)?(?:[?#].*)?$"], "lowerCased": true}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) IN ('consumer-affairs', 'consumeraffairs');

-- credit-karma (creditkarma)
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.creditkarma.com/credit-cards/insights/phillips-66-commercial-credit-card", "acceptableFormats": ["insights/amex-gold", "credit-cards/insights/phillips-66-commercial-credit-card", "personal-loan/single/id/lending-point-personal-loans", "auto-insurance/allstate", "https://www.creditkarma.com/reviews/auto-loan/single/id/AutoPay", "https://www.creditkarma.com/reviews/credit-card/single/id/CCCapitalOne1007", "https://www.creditkarma.com/credit-cards/insights/phillips-66-commercial-credit-card"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*creditkarma(?:\\.[a-z]{2,3}){1,2})\\/)?(?:credit-cards|reviews)\\/)?)([\\w\\/\\-]+)(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) IN ('credit-karma', 'creditkarma');

-- customer-lobby
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.customerlobby.com/reviews/1655/ontrack-staffing", "acceptableFormats": ["1655", "1655/ontrack-staffing", "https://www.customerlobby.com/reviews/1655/ontrack-staffing"], "patterns": ["^(?:(?:(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*customerlobby(?:\\.[a-z]{2,3}){1,2})?\\/)?reviews)?\\/)?(\\d+(?:\\/[\\-\\w]+)?)\\/?(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) = 'customer-lobby';

-- dealer-rater (dealerrater)
UPDATE platforms 
SET instructions = $JSON${"exampleUrl": "https://www.dealerrater.com/dealer/Holiday-Chrysler-Dodge-Jeep-Ram-dealer-reviews-103572", "acceptableFormats": ["103572", "Holiday-Chrysler-Dodge-Jeep-Ram-dealer-reviews-103572", "dealer/Holiday-Chrysler-Dodge-Jeep-Ram-dealer-reviews-103572", "https://www.dealerrater.com/dealer/Holiday-Chrysler-Dodge-Jeep-Ram-dealer-reviews-103572", "sales/Matthew-Jackson-review-829308", "www.dealerrater.com/sales/Matthew-Jackson-review-829308", "https://www.dealerrater.com/sales/Matthew-Jackson-review-829308/"], "patterns": ["^(?:(?:(?:https?:\\/\\/)?(?:[\\w-]+\\.)*dealerrater(?:\\.[a-z]{2,3}){1,2})?\\/)?((?:dealer\\/|sales\\/)?[\\w-]*\\d+)(?:\\/[\\w-]+)?\\/?(?:[?#].*)?$"], "lowerCased": false}$JSON$::jsonb,
    is_active = TRUE
WHERE LOWER(name) IN ('dealer-rater', 'dealerrater');

-- Continue with more platforms...
