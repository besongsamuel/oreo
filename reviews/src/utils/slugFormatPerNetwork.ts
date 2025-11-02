// Slug format instructions for each platform
// This data is used to help users find the correct slug/ID for platform connections

export interface PlatformSlugFormat {
    exampleUrl: string;
    acceptableFormats: string[];
    patterns: string[];
    lowerCased?: boolean;
}

export const slugFormatPerNetwork: Record<string, PlatformSlugFormat> = {
    "abritel": {
        "exampleUrl": "https:\/\/www.abritel.fr\/pdp\/lo\/1217263",
        "acceptableFormats": [
            "pdp\/lo\/1217263",
            "https:\/\/www.abritel.fr\/pdp\/lo\/1217263",
            "location-vacances\/p2320528vb",
            "https:\/\/www.abritel.fr\/location-vacances\/p2320528vb",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*abritel\\.fr)?\/)?((?:[\\w-]+\/)*[a-z]{0,2}\\d+[a-z]{0,2})\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "agoda": {
        "exampleUrl":
            "https:\/\/www.agoda.com\/days-inn-by-wyndham-miami-international-airport\/hotel\/miami-fl-us.html",
        "acceptableFormats": [
            "ibis-styles-paris-roissy-cdg-hotel\/hotel\/paris-fr",
            "https:\/\/www.agoda.com\/ibis-styles-paris-roissy-cdg-hotel\/hotel\/paris-fr.html",
            "https:\/\/www.agoda.com\/ibis-styles-paris-roissy-cdg-hotel\/reviews\/paris-fr.html",
            "https:\/\/www.agoda.com\/ibis-styles-paris-roissy-cdg-hotel\/hotel\/all\/paris-fr.html",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*agoda(?:\\.[a-z]{2,3}){1,2})?\/)?(?:[a-z]{2}-[a-z]{2}\/)?([\\w-]+\/\\w+\/(?:all\/)?(?:[\\w-]+\/)?[\\w-]+)(?:\\.html(?:[?#\/].*)?)?$",
        ],
        "lowerCased": false,
    },
    "airbnb": {
        "exampleUrl": "https:\/\/www.airbnb.co.in\/rooms\/1100739390072754079",
        "acceptableFormats": [
            "1100739390072754079",
            "rooms\/1100739390072754079",
            "https:\/\/www.airbnb.co.in\/rooms\/1100739390072754079",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*airbnb(?:\\.[a-z]{2,3}){1,2}\/)?\/?))?(?:[\\w+-]+)?\/)?([\\d+-]+)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "aliexpress": {
        "exampleUrl":
            "https:\/\/www.aliexpress.com\/item\/1005008932789738.html",
        "acceptableFormats": [
            "1005008932789738",
            "1005008932789738.html",
            "item\/1005008932789738.html",
            "https:\/\/www.aliexpress.com\/item\/1005008932789738.html",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*aliexpress(?:\\.[a-z]{2,3}){1,2}\/)?\/?))?(?:[\\w+-]+)?\/)?([\\d+]+)\/?(?:[?#].*)?",
        ],
        "lowerCased": false,
    },
    "alternative-to": {
        "exampleUrl":
            "https:\/\/www.alternativeto.net\/software\/typeform\/about",
        "acceptableFormats": [
            "typeform",
            "software\/typeform",
            "https:\/\/www.alternativeto.net\/software\/typeform",
            "https:\/\/www.alternativeto.net\/software\/typeform\/about",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*alternativeto(?:\\.[a-z]{2,3}){1,2})?\/)?software)?\/)?([-\\w]+)(?:\/[\\w-]+)*\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "angi": {
        "exampleUrl":
            "https:\/\/www.angi.com\/companylist\/us\/ca\/poway\/crawl-space-and-attic-pro-reviews-9469089.htm",
        "acceptableFormats": [
            "ca\/poway\/crawl-space-and-attic-pro-reviews-9469089",
            "https:\/\/www.angi.com\/companylist\/us\/ca\/poway\/crawl-space-and-attic-pro-reviews-9469089.htm",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*angi(?:eslist)?\\.com)?\/)?companylist)?\/)?us)?\/)?([a-z]{2}\/[\\w-]+\/[-+%_\\p{L}\\p{N}',\"]+-reviews-\\d+)(?:\\.htm\/?(?:[?#].*)?)?$",
        ],
        "lowerCased": false,
    },
    "aptguide": {
        "exampleUrl":
            "https:\/\/www.apartmentguide.com\/apartments\/California\/San-Diego\/The-Village-Mission-Valley\/155467\/",
        "acceptableFormats": [
            "88451",
            "Maa-Lenox-Atlanta-GA-88451",
            "MAA-Lenox\/88451",
            "apartments\/California\/San-Diego\/MAA-Lenox\/88451",
            "rent\/Maa-Lenox-Atlanta-GA-88451",
            "https:\/\/www.apartmentguide.com\/apartments\/Georgia\/Atlanta\/MAA-Lenox\/88451\/",
            "https:\/\/www.apartmentguide.com\/rent\/Maa-Lenox-Atlanta-GA-88451\/",
            "https:\/\/www.apartmentguide.com\/a\/Quincy-New-York-NY-5920858\/",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*apartmentguide\\.com)?\/)?[a-z_]+)?\/)?(?:[a-z-]+\/){0,2}((?:[\\w~+!\\@-]*[\/-])?[\\da-z]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "aptratings": {
        "exampleUrl":
            "https:\/\/www.apartmentratings.com\/tx\/dallas\/courts-at-preston-oaks_972788142275240",
        "acceptableFormats": [
            "courts-at-preston-oaks_972788142275240",
            "https:\/\/www.apartmentratings.com\/tx\/dallas\/courts-at-preston-oaks_972788142275240",
            "972788142275240",
        ],
        "patterns": [
            '^(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*apartmentratings\\.com)?\/)?[a-z]{2}\/[-+%_\\p{L}\\p{N}\',"*~`\u2018"\u00a8\u201c\u201e\u00b0\\s,:%!?@#.\\(\\)\\\\|\u00ae\u00a9\u2122&\u00a3$\u20ac\u00a2]+\/)?((?:[-+%_\\p{L}\\p{N}\',"*~`\u2018"\u00a8\u201c\u201e\u00b0\\s,:%!?@#.\\(\\)\\\\|\u00ae\u00a9\u2122&\u00a3$\u20ac\u00a2]+_)?\\d+)(:?_\\w+)?(?:\/\\w+)*\/?(?:[?#].*)?$',
        ],
        "lowerCased": true,
    },
    "apartments": {
        "exampleUrl":
            "https:\/\/www.apartments.com\/overture-san-marcos-55-senior-housing-apa-san-marcos-ca\/5jm0mwp",
        "acceptableFormats": [
            "5jm0mwp",
            "overture-san-marcos-55-senior-housing-apa-san-marcos-ca\/5jm0mwp",
            "https:\/\/www.apartments.com\/overture-san-marcos-55-senior-housing-apa-san-marcos-ca\/5jm0mwp",
            "https:\/\/www.apartments.com\/es\/overture-san-marcos-55-senior-housing-apa-san-marcos-ca\/5jm0mwp",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*apartments\\.com)?\/)?(?:[a-z]{2}\/)?[\\w-]+)?\/)?([\\da-z]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "place-for-mom": {
        "exampleUrl":
            "https:\/\/www.aplaceformom.com\/community\/amber-court-of-brooklyn-61756",
        "acceptableFormats": [
            "community\/amber-court-of-brooklyn-61756",
            "https:\/\/www.aplaceformom.com\/community\/amber-court-of-brooklyn-61756",
            "providers\/aa-blank-7671",
            "https:\/\/www.aplaceformom.com\/providers\/aa-blank-7671",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*aplaceformom(?:\\.[a-z]{2,3}){1,2})?\/)?((?:community|providers)\/(?:\\w+-)*\\d+)\/?(?:\/?[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "app-store": {
        "exampleUrl": "https:\/\/apps.apple.com\/app\/bna\/id1523383806",
        "acceptableFormats": [
            "1523383806",
            "bna\/id1523383806",
            "app\/bna\/id1523383806",
            "https:\/\/apps.apple.com\/app\/bna\/id1523383806",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*apps.apple(?:\\.[a-z]{2,3}){1,2})?\/)?(?:[\\w]{2}\/)?)?)?app)?\/)?[\\w-]+)?\/)?)(?:id)?([\\d]+)(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "apple-maps": {
        "exampleUrl":
            "https:\/\/maps.apple.com\/place?auid=2404254127207869658",
        "acceptableFormats": [
            "2404254127207869658",
            "https:\/\/maps.apple.com\/place?auid=2404254127207869658",
            "ID4C29E6DBFA72090",
            "https:\/\/maps.apple.com\/place?placeid=ID4C29E6DBFA72090",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*maps\\.apple\\.[a-z]{2,3}(?:\\.[a-z]{2})?(?:\/place)?\/?\\?(?:.*&)?(?:au|place)id=([A-Z\\d]+)(?:[#&].*)?)|([A-Z\\d]+))$",
        ],
        "lowerCased": false,
    },
    "auto-trader": {
        "exampleUrl":
            "https:\/\/www.autotrader.com\/car-dealers\/schaumburg-il\/892869\/zeigler-chevrolet-schaumburg\/",
        "acceptableFormats": [
            "car-dealers\/schaumburg-il\/892869",
            "car-dealers\/schaumburg-il\/892869\/zeigler-chevrolet-schaumburg\/",
            "https:\/\/www.autotrader.com\/car-dealers\/schaumburg-il\/892869\/zeigler-chevrolet-schaumburg\/",
            "cars-for-sale\/vehicle\/750347196",
            "https:\/\/www.autotrader.com\/cars-for-sale\/vehicle\/750347196",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*autotrader(?:\\.[a-z]{2,3}){1,2})?\/)?((?:cars-for-sale|car-dealers)\/[-\\w]+\/\\d+)(?:\/[\\w-]+)*\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "avvo": {
        "exampleUrl":
            "https:\/\/www.avvo.com\/attorneys\/02109-ma-steven-gurdin-1359546.html",
        "acceptableFormats": [
            "02109-ma-steven-gurdin-1359546",
            "1359546",
            "https:\/\/www.avvo.com\/attorneys\/02109-ma-steven-gurdin-1359546.html",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*avvo(?:\\.[a-z]{2,3}){1,2})?\/)?attorneys)?\/)?((?:\\w+-)*\\d+)(?:(?:\/[a-z]+)*\\.html\/?(?:\/?[?#].*)?)?$",
        ],
    },
    "bbb": {
        "exampleUrl":
            "https:\/\/www.bbb.org\/us\/pa\/king-of-prussia\/profile\/property-management\/morgan-properties-0241-80016288",
        "acceptableFormats": [
            "morgan-properties-0241-80016288",
            "https:\/\/www.bbb.org\/us\/pa\/king-of-prussia\/profile\/property-management\/morgan-properties-0241-80016288",
            "0241-80016288",
        ],
        "patterns": [
            '^(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*bbb\\.org\/[a-zA-Z]+\/[a-zA-Z]+\/[-+%_\\p{L}\\p{N}\',"]+\/(?:profile|perfil|charity-review)\/[-+%_\\p{L}\\p{N}\',"]+\/)?((?:[-+%_\\p{L}\\p{N}\',"*~`\u2018"\u00a8\u201c\u201e\u00b0\\s,:%!?@#.\\(\\)\\\\|\u00ae\u00a9\u2122&\u00a3$\u20ac\u00a2]+)?\\d+-\\d+)(?:\/[\\w-]+)*\/?(?:[?#].*)?$',
        ],
        "lowerCased": true,
    },
    "best-buy": {
        "exampleUrl":
            "https:\/\/www.bestbuy.com\/site\/sony-alpha-6100-mirrorless-4k-video-camera-with-e-pz-16-50mm-lens-black\/6614508.p",
        "acceptableFormats": [
            "com\/site\/lg-75-class-ut70-series-led-4k-uhd-smart-webos-tv-2024\/6593575.p?skuId=6593575",
            "https:\/\/www.bestbuy.com\/site\/sony-alpha-6100-mirrorless-4k-video-camera-with-e-pz-16-50mm-lens-black\/6614508.p",
            "https:\/\/www.bestbuy.ca\/en-ca\/product\/lg-0-9-cu-ft-microwave-with-smart-inverter-mser0990s-stainless-steel\/17937198",
        ],
        "patterns": [
            "^(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*bestbuy\\.)?([a-z]{2,3}\/(?:[a-z]{2}-[a-z]{2}\/)?(?:site|product)(?:\/[\\w.-]+)+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "bilbayt": {
        "exampleUrl": "https:\/\/bilbayt.com\/kw\/en\/vendors\/fusion",
        "acceptableFormats": [
            "fusion",
            "vendors\/fusion",
            "en\/vendors\/fusion",
            "kw\/ar\/vendors\/fusion",
            "https:\/\/bilbayt.com\/kw\/en\/vendors\/fusion",
            "https:\/\/bilbayt.com\/ae\/ar\/vendors\/pattie-pattie",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*bilbayt(?:\\.[a-z]{2,3}){1,2})?\/)?(?:kw|ae))?\/)?[a-z]{2})?\/)?vendors)?\/)?([\\w-]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "bing": {
        "exampleUrl":
            "https:\/\/www.bing.com\/maps?osid=c5a1cb29-5171-494c-ad4c-a5c2599c7278",
        "acceptableFormats": [
            "c5a1cb29-5171-494c-ad4c-a5c2599c7278",
            "YN8000x16403903209167712259",
            "https:\/\/www.bing.com\/maps?osid=c5a1cb29-5171-494c-ad4c-a5c2599c7278",
            "https:\/\/www.bing.com\/maps?ypid=YN8000x16403903209167712259",
            "https:\/\/www.bing.com\/maps?&ty=18&q=Sourdough%26Co.&ss=ypid.873x16370840542229259941",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*bing(?:\\.[a-z]{2,3}){1,2})?\/)?(?:maps))?\/?)?(?:(?:\\?.*)))?(?:osid|ypid)[=.])?([\\w-]+)(?:&.*)?$",
        ],
        "lowerCased": false,
    },
    "bol": {
        "exampleUrl": "https:\/\/www.bol.com\/be\/fr\/v\/supfoods\/1814801",
        "acceptableFormats": [
            "9300000001023970",
            "transmetteur-fm-bluetooth-wegman-chargeur-de-voiture-kit-de-voiture-bluetooth\/9300000001023970",
            "p\/transmetteur-fm-bluetooth-wegman-chargeur-de-voiture-kit-de-voiture-bluetooth\/9300000001023970",
            "nl\/p\/transmetteur-fm-bluetooth-wegman-chargeur-de-voiture-kit-de-voiture-bluetooth\/9300000001023970",
            "nl\/fr\/p\/transmetteur-fm-bluetooth-wegman-chargeur-de-voiture-kit-de-voiture-bluetooth\/9300000001023970",
            "https:\/\/www.bol.com\/nl\/fr\/p\/transmetteur-fm-bluetooth-wegman-chargeur-de-voiture-kit-de-voiture-bluetooth\/9300000001023970",
            "be\/v\/supfoods\/1814801",
            "be\/fr\/v\/supfoods\/1814801",
            "https:\/\/www.bol.com\/be\/fr\/v\/supfoods\/1814801",
        ],
        "patterns": [
            "^(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*bol(?:\\.[a-z]{2,3}){1,2})?)?\/)?((?:(?:(?:(?:be|nl)\/(?:fr\/|nl\/)?)?[vp]\/)?[\\w-]+\/)?\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "bookabach": {
        "exampleUrl": "https:\/\/www.bookabach.co.nz\/pdp\/lo\/1217263",
        "acceptableFormats": [
            "pdp\/lo\/1217263",
            "https:\/\/www.bookabach.co.nz\/pdp\/lo\/1217263",
            "holiday-accommodation\/p2320528vb",
            "https:\/\/www.bookabach.co.nz\/holiday-accommodation\/p2320528vb",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*bookabach\\.co\\.nz)?\/)?((?:[\\w-]+\/)*[a-z]{0,2}\\d+[a-z]{0,2})\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "booking": {
        "exampleUrl":
            "https:\/\/www.booking.com\/hotel\/it\/largo-argentina-apartment-daplace-apartments",
        "acceptableFormats": [
            "hotel\/it\/largo-argentina-apartment-daplace-apartments",
            "attractions\/us\/prywkuaglxhb-las-vegas-strip-helicopter-ride-at-night",
            "https:\/\/www.booking.com\/hotel\/it\/largo-argentina-apartment-daplace-apartments.it.html",
            "https:\/\/www.booking.com\/attractions\/us\/prywkuaglxhb-las-vegas-strip-helicopter-ride-at-night.html",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*booking(?:\\.[a-z]{2,3}){1,2})?\/)?((?:hotel|attractions)\/[a-z]{2}\/[\\w-]+)(?:(?:\\.[a-z]{2}(?:-[a-z]{2})?)?\\.html(?:[?#].*)?)?$",
        ],
        "lowerCased": true,
    },
    "capterra": {
        "exampleUrl": "https:\/\/www.capterra.com\/p\/149522\/Salesflare\/",
        "acceptableFormats": [
            "p\/149522\/Salesflare",
            "sp\/8652\/revlocal",
            "https:\/\/www.capterra.com\/p\/149522\/Salesflare\/reviews",
            "https:\/\/www.capterra.com\/services\/sp\/8652\/revlocal\/",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*capterra(?:\\.[a-z]{2,3}){1,2})?\/)?((?:(?:services\/)?s)?p\/\\d+\/[\\w-]+)(?:[?#\/].*)?$",
        ],
        "lowerCased": false,
    },
    "car-dealer-reviews": {
        "exampleUrl":
            "https:\/\/www.cardealerreviews.co.uk\/dealership\/1-stop-car-sales-peterborough",
        "acceptableFormats": [
            "1-stop-car-sales-peterborough",
            "dealership\/1-stop-car-sales-peterborough",
            "https:\/\/www.cardealerreviews.co.uk\/dealership\/1-stop-car-sales-peterborough",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*cardealerreviews(?:\\.[a-z]{2,3}){1,2})?\/)?dealership)?\/)?([-\\w]+)(?:\/?[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "care": {
        "exampleUrl":
            "https:\/\/www.care.com\/b\/l\/less-than-10-beds-regal-care\/simi-valley-ca",
        "acceptableFormats": [
            "less-than-10-beds-regal-care\/simi-valley-ca",
            "l\/less-than-10-beds-regal-care\/simi-valley-ca",
            "b\/l\/less-than-10-beds-regal-care\/simi-valley-ca",
            "https:\/\/www.care.com\/b\/l\/less-than-10-beds-regal-care\/simi-valley-ca",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*care(?:\\.[a-z]{2,3}){1,2})?\/)?b)?\/)?l)?\/)?([\\w-]+\/[\\w-]+)(?:\/[\\w-]+)*\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "carfax": {
        "exampleUrl":
            "https:\/\/www.carfax.com\/Reviews-Cronin-Chrysler-Dodge-Jeep-Ram-Lebanon-OH_P9E4IWXPNS",
        "acceptableFormats": [
            "Reviews-Cronin-Chrysler-Dodge-Jeep-Ram-Lebanon-OH_P9E4IWXPNS",
            "P9E4IWXPNS",
            "https:\/\/www.carfax.com\/Reviews-Cronin-Chrysler-Dodge-Jeep-Ram-Lebanon-OH_P9E4IWXPNS",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*carfax(?:\\.[a-z]{2,3}){1,2})?\/)?(?:[a-z]{2}\/)?(Reviews(?:-[A-Za-z\\d_]+)+_[A-Z\\d]{5,13})\/?(?:[?#].*)?$",
            "@^[A-Z\\d]{5,13}$@i",
        ],
        "lowerCased": false,
    },
    "car-gurus": {
        "exampleUrl":
            "https:\/\/www.cargurus.com\/Cars\/m-Diamond-Honda-sp285048",
        "acceptableFormats": [
            "m-Diamond-Honda-sp285048",
            "https:\/\/www.cargurus.com\/Cars\/m-Diamond-Honda-sp285048",
            "https:\/\/www.cargurus.com\/Cars\/inventorylistingviewDetailsFilterViewInventoryListing.action?zip=90001&distance=50&entitySelectingHelper.selectedEntity=m124#listing=417878058\/NONE\/DEFAULT",
            "Cars\/inventorylistingviewDetailsFilterViewInventoryListing.action?zip=90001&distance=50&entitySelectingHelper.selectedEntity=m124#listing=417878058\/NONE\/DEFAULT",
            "Cars\/inventorylisting\/vdp.action?listingId=414225544&pid=homepage~consumer~price_drop_shelf_card&position=1#listing=417878058",
            "vdp.action?listingId=414225544&pid=homepage~consumer~price_drop_shelf_card&position=1#listing=417878058",
            "listing=417878058",
            "listingId=414225544",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*cargurus(?:\\.[a-z]{2,3}){1,2})?\/)?Cars)?\/)?([\\w-]+-sp\\d+)(?:\/?[?#].*)?$",
            "^(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*cargurus(?:\\.[a-z]{2,3}){1,2})?\/)?Cars)?\/)?[\\w.-\/]+)?\/)?[?#])?.+)?(listing=\\d+).*$",
            "^(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*cargurus(?:\\.[a-z]{2,3}){1,2})?\/)?Cars)?\/)?[\\w.-\/]+)?\/)?[?#])?.+)?(listingId=\\d+).*$",
        ],
        "lowerCased": false,
    },
    "cars": {
        "exampleUrl":
            "https:\/\/www.cars.com\/dealers\/6000406\/porsche-downtown-chicago\/",
        "acceptableFormats": [
            "6000406\/porsche-downtown-chicago",
            "6000406",
            "dealers\/6000406\/porsche-downtown-chicago",
            "https:\/\/www.cars.com\/dealers\/6000406\/porsche-downtown-chicago\/",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*cars(?:\\.[a-z]{2,3}){1,2})?\/)?dealers)?\/)?([\\d]+(?:\/[\\w-]+)?)(\/[\\w-]+)*\/?(?:\/?[?#].*)?$",
        ],
    },
    "carvana": {
        "exampleUrl": "https:\/\/www.carvana.com\/vehicle\/3619014",
        "acceptableFormats": [
            "3619014",
            "vehicle\/3619014",
            "https:\/\/www.carvana.com\/vehicle\/3619014",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*carvana(?:\\.[a-z]{2,3}){1,2})?\/)?vehicle)?\/)?(\\d+)(?:\/?[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "citysearch": {
        "exampleUrl": "https:\/\/www.citysearch.com\/profile\/17639251",
        "acceptableFormats": [
            "17639251",
            "https:\/\/www.citysearch.com\/profile\/17639251",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*citysearch\\.com)?\/)?profile)?\/)?(\\d+)(?:\/(?:(?:\\w+\/)?[-+%_\\p{L}\\p{N}',\"]+\\.html\/?(?:[?#].*)?)?)?$",
        ],
        "lowerCased": false,
    },
    "class-pass": {
        "exampleUrl": "https:\/\/classpass.com\/studios\/bodi-scottsdale",
        "acceptableFormats": [
            "bodi-scottsdale",
            "studios\/bodi-scottsdale",
            "https:\/\/classpass.com\/studios\/bodi-scottsdale",
            "25110",
            "https:\/\/classpass.com\/studios\/25110",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*classpass(?:\\.[a-z]{2,3}){1,2})?\/)?studios)?\/)?([\\w-]+)(?:\/?[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "clutch": {
        "exampleUrl": "https:\/\/www.clutch.co\/profile\/geekyants",
        "acceptableFormats": [
            "geekyants",
            "https:\/\/clutch.co\/profile\/geekyants",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*(?:clutch\\.co)?)?\/)?profile)?\/)?([\\w-]+)(?:\/?[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "consumer-affairs": {
        "exampleUrl":
            "https:\/\/www.consumeraffairs.com\/solar-energy\/sunpower.html",
        "acceptableFormats": [
            "solar-energy\/sunpower",
            "https:\/\/www.consumeraffairs.com\/solar-energy\/sunpower.html",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*consumeraffairs(?:\\.[a-z]{2,3}){1,2})?\/)?((?:[\\w-]+\/)+[\\w-]+)(?:\\.html)?(?:[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "credit-karma": {
        "exampleUrl":
            "https:\/\/www.creditkarma.com\/credit-cards\/insights\/phillips-66-commercial-credit-card",
        "acceptableFormats": [
            "insights\/amex-gold",
            "credit-cards\/insights\/phillips-66-commercial-credit-card",
            "personal-loan\/single\/id\/lending-point-personal-loans",
            "auto-insurance\/allstate",
            "https:\/\/www.creditkarma.com\/reviews\/auto-loan\/single\/id\/AutoPay",
            "https:\/\/www.creditkarma.com\/reviews\/credit-card\/single\/id\/CCCapitalOne1007",
            "https:\/\/www.creditkarma.com\/credit-cards\/insights\/phillips-66-commercial-credit-card",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*creditkarma(?:\\.[a-z]{2,3}){1,2})\/)?(?:credit-cards|reviews)\/)?)([\\w\/-]+)(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "customer-lobby": {
        "exampleUrl":
            "https:\/\/www.customerlobby.com\/reviews\/1655\/ontrack-staffing",
        "acceptableFormats": [
            "1655",
            "1655\/ontrack-staffing",
            "https:\/\/www.customerlobby.com\/reviews\/1655\/ontrack-staffing",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*customerlobby(?:\\.[a-z]{2,3}){1,2})?\/)?reviews)?\/)?(\\d+(?:\/[-\\w]+)?)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "dealer-rater": {
        "exampleUrl":
            "https:\/\/www.dealerrater.com\/dealer\/Holiday-Chrysler-Dodge-Jeep-Ram-dealer-reviews-103572",
        "acceptableFormats": [
            "103572",
            "Holiday-Chrysler-Dodge-Jeep-Ram-dealer-reviews-103572",
            "dealer\/Holiday-Chrysler-Dodge-Jeep-Ram-dealer-reviews-103572",
            "https:\/\/www.dealerrater.com\/dealer\/Holiday-Chrysler-Dodge-Jeep-Ram-dealer-reviews-103572",
            "sales\/Matthew-Jackson-review-829308",
            "www.dealerrater.com\/sales\/Matthew-Jackson-review-829308",
            "https:\/\/www.dealerrater.com\/sales\/Matthew-Jackson-review-829308\/",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*dealerrater(?:\\.[a-z]{2,3}){1,2})?\/)?((?:dealer\/|sales\/)?[\\w-]*\\d+)(?:\/[\\w-]+)?\/?(?:[?#].*)?$",
        ],
    },
    "deliveroo": {
        "exampleUrl":
            "https:\/\/deliveroo.co.uk\/menu\/Manchester\/manchester-central\/sandinista-2-old-bank-street",
        "acceptableFormats": [
            "sandinista-2-old-bank-street",
            "manchester-central\/sandinista-2-old-bank-street",
            "Manchester\/manchester-central\/sandinista-2-old-bank-street",
            "menu\/Manchester\/manchester-central\/sandinista-2-old-bank-street",
            "https:\/\/deliveroo.co.uk\/menu\/Manchester\/manchester-central\/sandinista-2-old-bank-street",
            "https:\/\/deliveroo.ae\/menu\/Sharjah\/sharjah-industrial-1\/jollibee-city-centre-sharjah",
            "https:\/\/deliveroo.fr\/en\/menu\/Paris\/franconville-la-garenne\/five-guys-nice-franconville",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*deliveroo(?:\\.[a-z]{2,3}){1,2})?\/)?(?:[a-z]{2}\/)?)?)?menu)?\/)?[\\w-]+)?\/)?[\\w-]+)?\/)?([\\w-]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "design-my-night": {
        "exampleUrl":
            "https:\/\/www.designmynight.com\/london\/bars\/city-of-london\/sky-garden-bars",
        "acceptableFormats": [
            "sky-garden-bars",
            "london\/bars\/city-of-london\/sky-garden-bars",
            "https:\/\/www.designmynight.com\/london\/bars\/city-of-london\/sky-garden-bars",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*designmynight(?:\\.[a-z]{2,3}){1,2})?\/)?(?:(?:[\\w-]+\/[\\w-]+\/)?(?:[\\w-]+\/)?)?([\\w-]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "doctor": {
        "exampleUrl": "https:\/\/www.doctor.com\/Dr-Mark-Bouffard",
        "acceptableFormats": [
            "Dr-Mark-Bouffard",
            "https:\/\/www.doctor.com\/Dr-Mark-Bouffard",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*doctor(?:\\.[a-z]{2,3}){1,2})?\/)?([-\\w\\s]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "doordash": {
        "exampleUrl":
            "https:\/\/www.doordash.com\/store\/buffalo-wild-wings-lehi-202507",
        "acceptableFormats": [
            "buffalo-wild-wings-lehi-202507",
            "202507",
            "https:\/\/www.doordash.com\/store\/buffalo-wild-wings-lehi-202507",
            "https:\/\/www.doordash.com\/reviews\/store\/buffalo-wild-wings-lehi-202507",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*doordash\\.com)?\/)?(?:reviews\/)?store)?\/)?((?:\\w+-)*\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "ebay": {
        "exampleUrl": "https:\/\/www.ebay.com\/p\/2132093506",
        "acceptableFormats": [
            "https:\/\/www.ebay.com\/fdbk\/feedback_profile\/discountm36?user_context=BUYER",
            "https:\/\/www.ebay.com\/itm\/295531055305",
            "https:\/\/www.ebay.com\/p\/27011372058",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*ebay(?:\\.[a-z]{2,3}){1,2})?\/)?((?:itm|p|fdbk)\/(?:[\\w+-]+\/?)+)(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "edmunds": {
        "exampleUrl":
            "https:\/\/www.edmunds.com\/dealerships\/all\/north-carolina\/charlotte\/VictoryChevrolet_1\/",
        "acceptableFormats": [
            "VictoryChevrolet_1",
            "charlotte\/VictoryChevrolet_1",
            "north-carolina\/charlotte\/VictoryChevrolet_1",
            "dealerships\/all\/north-carolina\/charlotte\/VictoryChevrolet_1",
            "https:\/\/www.edmunds.com\/dealerships\/all\/north-carolina\/charlotte\/VictoryChevrolet_1\/",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*edmunds(?:\\.[a-z]{2,3}){1,2}\/)?\/?dealerships)?\/)?all)?\/)?[\\w-]+)?\/)?[\\w-]+)?\/)?([\\w-]+)(?:\/[\\w-]+)*\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "etsy": {
        "exampleUrl": "https:\/\/www.etsy.com\/shop\/MyOliveBoard",
        "acceptableFormats": [
            "MyOliveBoard",
            "shop\/MyOliveBoard",
            "etsy.com\/shop\/MyOliveBoard",
            "https:\/\/www.etsy.com\/shop\/MyOliveBoard",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*etsy(?:\\.[a-z]{2,3}){1,2})?\/)?(?:[a-z]{2}(?:-[a-z]{2})?\/)?shop)?\/)?([\\w-]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "expedia": {
        "exampleUrl":
            "https:\/\/www.expedia.com\/Worcester-Hotels-Hilton-Garden-Inn-BostonMarlborough.h14833039.Hotel-Information",
        "acceptableFormats": [
            "Worcester-Hotels-Hilton-Garden-Inn-BostonMarlborough.h14833039.Hotel-Information",
            "https:\/\/www.expedia.com\/Worcester-Hotels-Hilton-Garden-Inn-BostonMarlborough.h14833039.Hotel-Information",
            "Worcester-Hotels-Hilton-Garden-Inn-BostonMarlborough.h14833039",
            "h14833039",
            "14833039",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*expedia(?:\\.[a-z]{2,3}){1,2})?\/)?((?:[-+%_\\p{L}\\p{N}',\"]+\\.)?h?\\d+(?:\\.[-+%_\\p{L}\\p{N}',\"]+)?)\/?(?:[?#].*)?",
        ],
        "lowerCased": false,
    },
    "facebook": {
        "exampleUrl": "https:\/\/www.facebook.com\/premiatofornocantoni",
        "acceptableFormats": [
            "premiatofornocantoni",
            "830214057037039",
            "https:\/\/www.facebook.com\/premiatofornocantoni",
            "https:\/\/www.facebook.com\/830214057037039",
            "https:\/\/www.facebook.com\/pg\/premiatofornocantoni",
            "https:\/\/www.facebook.com\/pages\/Sugar%20Factory\/585288898581293",
        ],
        "patterns": [
            '^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*facebook(?:\\.[a-z]{2,3}){1,2})?\/(?:pg?\/)?)?([-+%_\\p{L}\\p{N}\',"*~`\u2018"\u00a8\u201c\u201e\u00b0\\s,:%!?@#.\\(\\)\\\\|\u00ae\u00a9\u2122&\u00a3$\u20ac\u00a2]+)(?:\/\\w+)*\/?(?:[?#].*)?$',
            '^(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*facebook(?:\\.[a-z]{2,3}){1,2})?\/)?(?:pages|people)\/)?[-+%_\\p{L}\\p{N}\',"*~`\u2018"\u00a8\u201c\u201e\u00b0\\s,:%!?@#.\\(\\)\\\\|\u00ae\u00a9\u2122&\u00a3$\u20ac\u00a2]+)?\/)?(\\d{14,})\/?(?:[?#].*)?$',
        ],
        "lowerCased": true,
    },
    "fertility-iq": {
        "exampleUrl":
            "https:\/\/www.fertilityiq.com\/fertilityiq\/doctors\/lee-caperton",
        "acceptableFormats": [
            "doctors\/lee-caperton",
            "fertilityiq\/doctors\/lee-caperton",
            "https:\/\/www.fertilityiq.com\/fertilityiq\/doctors\/lee-caperton",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*fertilityiq(?:\\.[a-z]{2,3}){1,2})?\/)?fertilityiq)?\/)?((?:clinics|doctors)\/[\\w-]+)(?:[?#\/].*)?$",
        ],
        "lowerCased": false,
    },
    "fewo-direkt": {
        "exampleUrl": "https:\/\/www.fewo-direkt.de\/pdp\/lo\/1217263",
        "acceptableFormats": [
            "pdp\/lo\/1217263",
            "https:\/\/www.fewo-direkt.de\/pdp\/lo\/1217263",
            "ferienwohnung-ferienhaus\/p2320528vb",
            "https:\/\/www.fewo-direkt.de\/ferienwohnung-ferienhaus\/p2320528vb",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*fewo-direkt\\.de)?\/)?((?:[\\w-]+\/)*[a-z]{0,2}\\d+[a-z]{0,2})\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "find-law": {
        "exampleUrl":
            "https:\/\/lawyers.findlaw.com\/florida\/lighthouse-point\/3411827_1\/",
        "acceptableFormats": [
            "mase-seitz-briggs-NTEwMjk1N18x",
            "florida\/miami\/mase-seitz-briggs-NTEwMjk1N18x",
            "3411827_1",
            "https:\/\/lawyers.findlaw.com\/florida\/lighthouse-point\/3411827_1\/",
            "https:\/\/lawyers.findlaw.com\/profile\/lawfirm\/jurewitz-law-group--injury--accident-lawyers\/ca\/carlsbad\/NTE2MDk3MV8x",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*findlaw(?:\\.[a-z]{2,3}){1,2})?\/?)?[\\w-]+)?\/)?[\\w-]+)?\/)?(?:[\\w-]+\/){,3}([\\w-]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "flipkart": {
        "exampleUrl":
            "https:\/\/www.flipkart.com\/panasonic-dmc-g85kgw-k-mirrorless-camera-body-14-42-mm-lens\/p\/itm5c5a7ee06c8b1",
        "acceptableFormats": [
            "itm5c5a7ee06c8b1",
            "p\/itm5c5a7ee06c8b1",
            "panasonic-dmc-g85kgw-k-mirrorless-camera-body-14-42-mm-lens\/p\/itm5c5a7ee06c8b1",
            "https:\/\/www.flipkart.com\/panasonic-dmc-g85kgw-k-mirrorless-camera-body-14-42-mm-lens\/p\/itm5c5a7ee06c8b1",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*flipkart(?:\\.[a-z]{2,3}){1,2})?\/)?((?:[\\w-]+\/)*itm\\w+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "foursquare": {
        "exampleUrl":
            "https:\/\/www.foursquare.com\/v\/bird-rock-coffee-roasters\/4a947bf6f964a520bf2120e3",
        "acceptableFormats": [
            "4a947bf6f964a520bf2120e3",
            "https:\/\/www.foursquare.com\/v\/bird-rock-coffee-roasters\/4a947bf6f964a520bf2120e3",
            "https:\/\/www.foursquare.com\/4a947bf6f964a520bf2120e3",
        ],
        "patterns": [
            "^(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*foursquare\\.com\/v\/(?:[-+%_\\p{L}\\p{N}',\"]+\/)?)?([a-z\\d]{24})\/?(?:[?#].*)?$",
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*foursquare\\.com\/)?([-+%_\\p{L}\\p{N}',\"]+))\/?(?:[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "gartner": {
        "exampleUrl":
            "https:\/\/www.gartner.com\/reviews\/market\/5g-enterprise-data-services\/vendor\/vodafone\/product\/vodafone-europe-africa-india-australia-new-zealand",
        "acceptableFormats": [
            "5g-enterprise-data-services\/vendor\/vodafone",
            "5g-enterprise-data-services\/vendor\/vodafone\/product\/vodafone-europe-africa-india-australia-new-zealand",
            "https:\/\/www.gartner.com\/reviews\/market\/5g-enterprise-data-services\/vendor\/vodafone\/product\/vodafone-europe-africa-india-australia-new-zealand",
            "https:\/\/www.gartner.com\/reviews\/market\/meeting-solutions\/vendor\/cisco-systems",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*gartner(?:\\.[a-z]{2,3}){1,2}\/)?reviews)?\/)?market)?\/)?([\\w+-]+\/vendor\/[\\w+-]+(?:\/product\/[\\w+-]+)?)(?:\/[\\w+-]+)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "glassdoor": {
        "exampleUrl":
            "https:\/\/www.glassdoor.com\/Reviews\/Tower-Health-Reviews-E1833870.htm",
        "acceptableFormats": [
            "Tower-Health-Reviews-E1833870",
            "https:\/\/www.glassdoor.com\/Reviews\/Tower-Health-Reviews-RVW1833870.htm",
            "https:\/\/www.glassdoor.com\/Overview\/Working-at-Tower-Health-EI_IE1833870.11,23.htm",
            "EI_IE1833870",
            "RVW1833870",
            "E1833870",
            "1833870",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*glassdoor(?:\\.[a-z]{2,3}){1,2})?\/)?[a-zA-Z]+)?\/)?((?:(?:[-+%_\\p{L}\\p{N}',\"]+-)?(?:E|EI_IE))?\\d+)(?:(?:_P\\d+)?(?:\\..+)*(?:\\.htm(?:[?#].*)?)?)?$",
        ],
        "lowerCased": false,
    },
    "goibibo": {
        "exampleUrl":
            "https:\/\/www.goibibo.com\/hotels\/shivam-bnb-hotel-in-goa-7731097284414613345",
        "acceptableFormats": [
            "7731097284414613345",
            "shivam-bnb-hotel-in-goa-7731097284414613345",
            "https:\/\/www.goibibo.com\/hotels\/shivam-bnb-hotel-in-goa-7731097284414613345",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*goibibo(?:\\.[a-z]{2,3}){1,2})?\/)?[\\w-]+)?\/)?((?:[\\w\\s()]+-)*\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "good-reads": {
        "exampleUrl":
            "https:\/\/www.goodreads.com\/book\/show\/51154652-el-sonido-de-las-olas",
        "acceptableFormats": [
            "51154652-el-sonido-de-las-olas",
            "show\/51154652-el-sonido-de-las-olas",
            "book\/show\/51154652-el-sonido-de-las-olas",
            "https:\/\/www.goodreads.com\/book\/show\/51154652-el-sonido-de-las-olas",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*goodreads(?:\\.[a-z]{2,3}){1,2})?\/)?book)?\/)?show)?\/)?(\\d+[-\\w.]*)\/?[\\w]*(?:\/?[\\w]*[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "google": {
        "exampleUrl": "https:\/\/www.google.com\/maps?cid=472717649119152494",
        "acceptableFormats": [
            "472717649119152494",
            "https:\/\/www.google.com\/maps?cid=472717649119152494",
            "https:\/\/maps.google.com\/maps?cid=472717649119152494",
            "ChIJx0JMBTFV2YARbgnOgjJujwY",
            "https:\/\/www.google.com\/maps\/place\/The+Cheesecake+Factory\/@32.76918,-117.1677887,17z\/data=!3m1!4b1!4m5!3m4!1s0x0:0x68f6e3282ce096e!8m2!3d32.76918!4d-117.1656",
            "ChoIzsbB-eTP8MqzARoNL2cvMTFiNXZfMWdoZhAB",
            "https:\/\/www.google.com\/travel\/hotels\/entity\/ChoIzsbB-eTP8MqzARoNL2cvMTFiNXZfMWdoZhAB",
            "0x68f6e3282ce096e",
        ],
        "patterns": [
            "^([\\w-]{27})$",
            "^(?:(?:(?:https?:\/\/)?(?:maps|www)\\.)?google(?:\\.[a-z]{2,3}){1,2}(?:\/maps)?\/?\\?(?:.*&)?cid=)?(\\d{17,21})(?:[#&].*)?$",
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*google(?:\\.[a-z]{2,3}){1,2}\/maps\/place\/.*\/data=!.*)?!)?1s)?0x[\\da-f]{1,16}:)?(0x[\\da-f]{15,16}).*$",
            '^(?:https?:\/\/)?(?:[\\w-]+\\.)*google(?:\\.[a-z]{2,3}){1,2}\/maps\/place\/[-+%_\\p{L}\\p{N}\',"*~`\u2018"\u00a8\u201c\u201e\u00b0\\s,:%!?@#.\\(\\)\\\\|\u00ae\u00a9\u2122&\u00a3$\u20ac\u00a2\/]+\/@-?\\d+(?:\\.\\d+)?,-?\\d+(?:\\.\\d+)?(?:,-?\\d+(?:\\.\\d+)?z?)?.*$',
            "^(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*google(?:\\.[a-z]{2,3}){1,2})?\/)?travel)?\/)?hotels)?\/)?entity)?\/)?([\\w-]{27,45})(?:\/[a-z]+)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "google-play": {
        "exampleUrl":
            "https:\/\/play.google.com\/store\/apps\/details?id=com.facebook.katana",
        "acceptableFormats": [
            "com.facebook.katana",
            "store\/apps\/details?id=com.facebook.katana",
            "https:\/\/play.google.com\/store\/apps\/details?id=com.facebook.katana",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*play.google(?:\\.[a-z]{2,3}){1,2})?\/)?store)?\/)?apps)?\/)?details)?\/?)?\\?)?(?:.+&)?id=)?([\\w\\.]+)(?:[#].*)?$",
        ],
        "lowerCased": true,
    },
    "great-schools": {
        "exampleUrl":
            "https:\/\/www.greatschools.org\/california\/san-diego\/11109-Mt.-Everest-Academy\/",
        "acceptableFormats": [
            "california\/san-diego\/11109-Mt.-Everest-Academy",
            "https:\/\/www.greatschools.org\/california\/san-diego\/11109-Mt.-Everest-Academy\/",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*greatschools(?:\\.[a-z]{2,3}){1,2})?\/)?([-\\w]+\/[-\\w]+\/\\d+[-\\w]+)(?:\/[-\\w]+)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "grubhub": {
        "exampleUrl":
            "https:\/\/www.grubhub.com\/restaurant\/22-thai-cuisine-59-nassau-st-new-york\/268858\/reviews",
        "acceptableFormats": [
            "268858",
            "https:\/\/www.grubhub.com\/restaurant\/22-thai-cuisine-59-nassau-st-new-york\/268858",
            "https:\/\/www.grubhub.com\/restaurant\/22-thai-cuisine-59-nassau-st-new-york\/268858\/reviews",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*grubhub\\.com)?\/)?restaurant)?\/)?[\\da-z_-]+)?\/)?(\\d+)(?:\/[a-z]+)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "healthgrades": {
        "exampleUrl":
            "https:\/\/www.healthgrades.com\/physician\/dr-brad-cohen-2knsj",
        "acceptableFormats": [
            "2knsj",
            "dr-brad-cohen-2knsj",
            "https:\/\/www.healthgrades.com\/physician\/dr-brad-cohen-2knsj",
            "group-directory\/ny-new-york\/new-york\/hudson-wellness-nyc-x8g96p",
            "https:\/\/www.healthgrades.com\/group-directory\/ny-new-york\/new-york\/hudson-wellness-nyc-x8g96p",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*healthgrades(?:\\.[a-z]{2,3}){1,2})?\/)?\\w+)?\/)?((?:\\w+-)*\\w+)(?:[?#].*)?$",
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*healthgrades(?:\\.[a-z]{2,3}){1,2})?\/)?(group-directory\/[\\w\/-]+)(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "hotels": {
        "exampleUrl":
            "https:\/\/www.hotels.com\/ho141243\/newcastle-gateshead-marriott-hotel-metrocentre-gateshead-united-kingdom",
        "acceptableFormats": [
            "ho141243",
            "ho141243\/newcastle-gateshead-marriott-hotel-metrocentre-gateshead-united-kingdom",
            "https:\/\/www.hotels.com\/ho141243\/newcastle-gateshead-marriott-hotel-metrocentre-gateshead-united-kingdom",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w.-]+\\.)?hotels(?:\\.[a-z]{2,3}){1,2})?\/)?((?:[-+%_\\p{L}\\p{N}',\"]+\\.)?ho?\\d+(?:\\\/[-+%_\\p{L}\\p{N}',\"]+)?)\/?(?:[?#].*)?",
        ],
        "lowerCased": false,
    },
    "holiday-check": {
        "exampleUrl":
            "https:\/\/www.holidaycheck.de\/hi\/hotel-metropol\/5335e45d-c66d-3ab5-983c-a1f587e23ef6",
        "acceptableFormats": [
            "5335e45d-c66d-3ab5-983c-a1f587e23ef6",
            "hotel-metropol\/5335e45d-c66d-3ab5-983c-a1f587e23ef6",
            "hi\/hotel-metropol\/5335e45d-c66d-3ab5-983c-a1f587e23ef6",
            "https:\/\/www.holidaycheck.de\/hi\/hotel-metropol\/5335e45d-c66d-3ab5-983c-a1f587e23ef6",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*holidaycheck(?:\\.[a-z]{2,3}){1,2})?\/)?[-\\w]+)?\/)?[-\\w]+)?\/)?([a-f\\d]{8}-[a-f\\d]{4}-[a-f\\d]{4}-[a-f\\d]{4}-[a-f\\d]{12})(?:\/[-\\w]+)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "home-advisor": {
        "exampleUrl":
            "https:\/\/www.homeadvisor.com\/rated.SDTechServices.116169158.html",
        "acceptableFormats": [
            "SDTechServices.116169158",
            "rated.SDTechServices.116169158.html",
            "https:\/\/www.homeadvisor.com\/rated.SDTechServices.116169158.html",
        ],
        "patterns": [
            "^(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*homeadvisor(?:\\.[a-z]{2,3}){1,2})?\/)?rated\\.)?([a-z]+\\.\\d+)(?:\\.html(?:[?#\/].*)?)?$",
        ],
        "lowerCased": false,
    },
    "houzz": {
        "exampleUrl":
            "https:\/\/www.houzz.com\/professionals\/general-contractors\/greener-concepts-design-build-pfvwus-pf~2014731451",
        "acceptableFormats": [
            "https:\/\/shophouzz.com\/products\/modrest-prospect-modern-large-round-walnut-dining-table-prvw-vr-153460127",
            "https:\/\/www.houzz.com\/professionals\/flooring-contractors\/national-floors-direct-inc-pfvwus-pf~378849444",
            "professionals\/kitchen-and-bath-remodelers\/unique-home-construction-pfvwus-pf~631257217",
            "products\/modrest-prospect-modern-large-round-walnut-dining-table-prvw-vr-153460127",
            "https:\/\/www.houzz.com\/professionals\/general-contractors\/greener-concepts-design-build-pfvwus-pf~2014731451",
        ],
        "patterns": [
            "^(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*(?:shop)?houzz(?:\\.[a-z]{2,3}){1,2})?\/)?(?:[\\w-]+\/)*)?((?:professionals|products)\/.+?[a-z]{2}[~-]?\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "home-stars": {
        "exampleUrl":
            "https:\/\/www.homestars.com\/profile\/2775316-cutting-edge-landscaping-and-snowplowing",
        "acceptableFormats": [
            "\/2775316-cutting-edge-landscaping-and-snowplowing",
            "\/profile\/2775316-cutting-edge-landscaping-and-snowplowing",
            "https:\/\/www.homestars.com\/profile\/2775316-cutting-edge-landscaping-and-snowplowing",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*homestars(?:\\.[a-z]{2,3}){1,2})?\/)?profile)?\/)?([-\\w]+)(?:\/reviews)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "indeed": {
        "exampleUrl": "https:\/\/www.indeed.com\/cmp\/Steadfast-Companies",
        "acceptableFormats": [
            "Steadfast-Companies",
            "https:\/\/www.indeed.com\/cmp\/Steadfast-Companies",
            "https:\/\/www.indeed.com\/cmp\/Steadfast-Companies\/reviews",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*indeed\\.com)?\/)?cmp)?\/)?([^?\/#]*)(?:\/reviews)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "influenster": {
        "exampleUrl":
            "https:\/\/www.influenster.com\/reviews\/vicks-cool-mist-humidifier",
        "acceptableFormats": [
            "vicks-cool-mist-humidifier",
            "reviews\/vicks-cool-mist-humidifier",
            "influenster.com\/reviews\/vicks-cool-mist-humidifier",
            "https:\/\/www.influenster.com\/reviews\/vicks-cool-mist-humidifier",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*influenster(?:\\.[a-z]{2,3}){1,2})?\/)?reviews)?\/)?([-\\w]+)(?:\/[\\w-]+)*\/?(?:[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "insider-pages": {
        "exampleUrl": "https:\/\/www.insiderpages.com\/profile\/17639251",
        "acceptableFormats": [
            "17639251",
            "profile\/17639251",
            "https:\/\/www.insiderpages.com\/profile\/17639251",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*insiderpages(?:\\.[a-z]{2,3}){1,2})?\/)?profile)?\/)?(\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "just-dial": {
        "exampleUrl":
            "https:\/\/www.justdial.com\/Delhi\/Moti-Mahal-Barbecues-Near-51-Metro-Station-Noida-Sector-51\/011PXX11-XX11-240211180543-H1S7_BZDET",
        "acceptableFormats": [
            "011PXX11-XX11-240211180543-H1S7",
            "011PXX11-XX11-240211180543-H1S7_BZDET",
            "Delhi\/Moti-Mahal-Barbecues-Near-51-Metro-Station-Noida-Sector-51\/011PXX11-XX11-240211180543-H1S7_BZDET",
            "justdial.com\/delhi\/Moti-mahal-Barbecues-Near-51-Metro-Station-Noida-Sector-51\/011PXX11-XX11-240211180543-H1S7_BZDET",
            "www.justdial.com\/delhi\/Moti-mahal-Barbecues-Near-51-Metro-Station-Noida-Sector-51\/011PXX11-XX11-240211180543-H1S7_BZDET",
            "https:\/\/www.justdial.com\/delhi\/Moti-mahal-Barbecues-Near-51-Metro-Station-Noida-Sector-51\/011PXX11-XX11-240211180543-H1S7_BZDET",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*justdial(?:\\.[a-z]{2,3}){1,2})?\/)?[\\w-]+)?\/)?[\\w-]+)?\/)?([a-z0-9-]+)(?:_BZDET)?(?:\/?[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "just-eat": {
        "exampleUrl":
            "https:\/\/www.just-eat.co.uk\/restaurants-busaba-thai-dining-covent-garden-london",
        "acceptableFormats": [
            "just-eat.co.uk\/restaurants-busaba-thai-dining-covent-garden-london",
            "justeat.it\/restaurants-burger-pizza-milano",
            "just-eat.es\/restaurants-greens-ronda-universitat-barcelona",
            "just-eat.ie\/restaurants-boojum-smithfield-dublin-7",
            "just-eat.ch\/it\/menu\/rapida-food",
            "https:\/\/www.just-eat.dk\/en\/menu\/sehers-2-pizza-grillbar",
        ],
        "patterns": [
            "^(?:https?:\/\/)?(?:[\\w-]+\\.)*(just-?eat(?:\\.[a-z]{2,3}){1,2}(?:\/[\\w-]+)+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "kayak": {
        "exampleUrl":
            "https:\/\/www.kayak.com\/hotels\/Skyways-Hotel,Los-Angeles-p61194-h24012-details",
        "acceptableFormats": [
            "24012",
            "Skyways-Hotel,Los-Angeles-p61194-h24012-details",
            "hotels\/Skyways-Hotel,Los-Angeles-p61194-h24012-details",
            "https:\/\/www.kayak.com\/hotels\/Skyways-Hotel,Los-Angeles-p61194-h24012-details",
            "Los-Angeles-Hotels-Super-8-by-Wyndham-Los-Angeles.24012.ksp",
            "https:\/\/www.kayak.com\/Los-Angeles-Hotels-Super-8-by-Wyndham-Los-Angeles.24012.ksp",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*kayak(?:\\.[a-z]{2,3}){1,2})?\/)?(?:hotels\/)?([-+%_\\p{L}\\p{N}',\"`]*[h.]?\\d+(?:-details|\\.ksp)?)(?:\/[\\w-]+)*\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "kbb": {
        "exampleUrl":
            "https:\/\/www.kbb.com\/dealers\/schaumburg-il\/892869\/zeigler-chevrolet-schaumburg\/",
        "acceptableFormats": [
            "dealers\/schaumburg-il\/892869",
            "dealers\/schaumburg-il\/892869\/zeigler-chevrolet-schaumburg\/",
            "https:\/\/www.kbb.com\/dealers\/schaumburg-il\/892869\/zeigler-chevrolet-schaumburg\/",
            "cars-for-sale\/vehicle\/750347196",
            "https:\/\/www.kbb.com\/cars-for-sale\/vehicle\/750347196",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*kbb(?:\\.[a-z]{2,3}){1,2})?\/)?((?:cars-for-sale|dealers)\/[-\\w]+\/\\d+)(?:\/[\\w-]+)*\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "lawyers": {
        "exampleUrl":
            "https:\/\/www.lawyers.com\/laguna-beach\/california\/nokes-and-quinn-a-professional-corporation-111221-f\/",
        "acceptableFormats": [
            "111221-f",
            "nokes-and-quinn-a-professional-corporation-111221-f",
            "https:\/\/www.lawyers.com\/laguna-beach\/california\/nokes-and-quinn-a-professional-corporation-111221-f\/",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*lawyers(?:\\.[a-z]{2,3}){1,2})?\/)?[\\w-]+)?\/)?[-\\w-]+)?\/)?((?:\\w+-)*\\d+-[af])\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "lending-tree": {
        "exampleUrl":
            "https:\/\/reviews.lendingtree.com\/lenders\/mortgage\/fifth-third-bank\/72106049",
        "acceptableFormats": [
            "mortgage\/fifth-third-bank\/72106049",
            "lenders\/mortgage\/fifth-third-bank\/72106049",
            "72106049",
            "https:\/\/reviews.lendingtree.com\/lenders\/mortgage\/fifth-third-bank\/72106049",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*lendingtree(?:\\.[a-z]{2,3}){1,2})?\/)?[\\w-]+)?\/)?[\\w-]+)?\/)?[\\w-]+)?\/)?(\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "lieferando": {
        "exampleUrl": "https:\/\/www.lieferando.de\/birdie-birdie-1",
        "acceptableFormats": [
            "lieferando.de\/birdie-birdie-1",
            "lieferando.de\/speisekarte\/birdie-birdie-1",
            "lieferando.de\/en\/menu\/birdie-birdie-1",
            "https:\/\/www.lieferando.de\/birdie-birdie-1",
            "https:\/\/lieferando.de\/birdie-birdie-1",
            "lieferando.at\/rapida-food",
            "https:\/\/www.lieferando.at\/en\/menu\/rapida-food",
        ],
        "patterns": [
            "^(?:https?:\/\/)?(?:[\\w-]+\\.)*(lieferando\\.(?:de|at)\/(?:(?:[a-z]{2}\/)?\\w+\/)?[\\w-]+)(?:\/?[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "lsa": {
        "exampleUrl":
            "https:\/\/www.google.com\/localservices\/prolist?spp=Cg0vZy8xMWZzcXA3cm03",
        "acceptableFormats": [
            "Cg0vZy8xMWZzcXA3cm03",
            "https:\/\/www.google.com\/localservices\/prolist?spp=Cg0vZy8xMWZzcXA3cm03",
            "https:\/\/www.google.com\/localservices\/profile?spp=Cg0vZy8xMWZzcXA3cm03",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*(?:google\\.[a-z]{2,3})?)?\/)?localservices)?\/)?pro(?:list|file))?\\?)?(?:.+&)?spp=)?([\\w=-]{20,})(?:[#&].*)?$",
        ],
        "lowerCased": false,
    },
    "make-my-trip": {
        "exampleUrl":
            "https:\/\/www.makemytrip.com\/hotels\/hotel-details\/?hotelId=201904300047376568&checkin=01019999&checkout=02019999",
        "acceptableFormats": [
            "201904300047376568",
            "hotelId=201904300047376568",
            "hotel-details\/?hotelId=201904300047376568",
            "hotels\/hotel-details\/?hotelId=201904300047376568",
            "https:\/\/www.makemytrip.com\/hotels\/hotel-details\/?hotelId=201904300047376568",
            "truliv_villa_macarena_best_villa_in_ecr-details-chennai",
            "truliv_villa_macarena_best_villa_in_ecr-details-chennai.html",
            "hotels\/truliv_villa_macarena_best_villa_in_ecr-details-chennai.html",
            "https:\/\/www.makemytrip.com\/hotels\/truliv_villa_macarena_best_villa_in_ecr-details-chennai.html",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*makemytrip(?:\\.[a-z]{2,3}){1,2})?\/)?hotels)?\/)?(?:(?:(?:hotel-details\/?)?(?:[?#].*))?hotelId=(\\d+).*|([\\w-]+)(?:\\.html)?(?:[?#].*)?)$",
        ],
        "lowerCased": false,
    },
    "martindale": {
        "exampleUrl":
            "https:\/\/www.martindale.com\/organization\/frenkel-frenkel-llp-1311923\/",
        "acceptableFormats": [
            "attorney\/david-freylikhman-158757013",
            "https:\/\/www.martindale.com\/attorney\/david-freylikhman-158757013",
            "organization\/frenkel-frenkel-llp-1311923",
            "https:\/\/www.martindale.com\/organization\/frenkel-frenkel-llp-1311923\/",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*martindale(?:\\.[a-z]{2,3}){1,2})?\/)?((?:organization|attorney)\/[\\w-]*\\d+)(?:\/[-\\w]+)*\/?(?:[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "motability": {
        "exampleUrl":
            "https:\/\/findadealer.motability.co.uk\/cars\/north-east\/newcastle-upon-tyne\/new-york-road-60937",
        "acceptableFormats": [
            "cars\/north-east\/newcastle-upon-tyne\/new-york-road-60937",
            "https:\/\/findadealer.motability.co.uk\/cars\/north-east\/newcastle-upon-tyne\/new-york-road-60937\/",
            "https:\/\/findadealer.motability.co.uk\/scooters-and-powered-wheelchairs\/east-midlands\/alvaston\/1287-london-road",
            "https:\/\/findadealer.motability.co.uk\/wheelchair-accessible-vehicles\/west-midlands\/coventry\/655-london-road",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*findadealer\\.motability(?:\\.[a-z]{2,3}){1,2})?\/?)?((?:[\\w-]+\/){3}[.\\w-]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "niche": {
        "exampleUrl":
            "https:\/\/www.niche.com\/k12\/the-spence-school-new-york-ny",
        "acceptableFormats": [
            "k12\/the-spence-school-new-york-ny",
            "https:\/\/www.niche.com\/k12\/the-spence-school-new-york-ny",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*niche(?:\\.[a-z]{2,3}){1,2})?\/)?([-\\w]+\/[-\\w]+)\/?(?:\\w+\/)?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "opentable": {
        "exampleUrl":
            "https:\/\/www.opentable.com\/r\/the-rooftop-by-stk-san-diego",
        "acceptableFormats": [
            "r\/the-rooftop-by-stk-san-diego",
            "https:\/\/www.opentable.com\/r\/the-rooftop-by-stk-san-diego",
            "https:\/\/www.opentable.com\/bencotto-italian-kitchen",
            "bencotto-italian-kitchen",
            "https:\/\/www.opentable.com\/restaurant\/profile\/1234567891234",
            "1234567891234",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*opentable(?:\\.[a-z]{2,3}){1,2})?\/)?((?:r\/)?[-+%_\\p{L}\\p{N}',\"]+)\/?(?:[?#].*)?$",
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*opentable(?:\\.[a-z]{2,3}){1,2})?\/restaurant\/profile\/)?(\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "orbitz": {
        "exampleUrl":
            "https:\/\/www.orbitz.com\/Worcester-Hotels-Hilton-Garden-Inn-BostonMarlborough.h14833039.Hotel-Information",
        "acceptableFormats": [
            "Worcester-Hotels-Hilton-Garden-Inn-BostonMarlborough.h14833039.Hotel-Information",
            "https:\/\/www.orbitz.com\/Worcester-Hotels-Hilton-Garden-Inn-BostonMarlborough.h14833039.Hotel-Information",
            "Worcester-Hotels-Hilton-Garden-Inn-BostonMarlborough.h14833039",
            "h14833039",
            "14833039",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*orbitz(?:\\.[a-z]{2,3}){1,2})?\/)?((?:[-+%_\\p{L}\\p{N}',\"]+\\.)?h?\\d+(?:\\.[-+%_\\p{L}\\p{N}',\"]+)?)\/?(?:[?#].*)?",
        ],
        "lowerCased": false,
    },
    "pages-jaunes": {
        "exampleUrl": "https:\/\/www.pagesjaunes.fr\/pros\/57672837",
        "acceptableFormats": [
            "57672837",
            "https:\/\/www.pagesjaunes.fr\/pros\/57672837",
            "https:\/\/www.pagesjaunes.fr\/pros\/detail?bloc_id=51362276000001C0001&no_sequence=1&code_rubrique=30101400",
            "https:\/\/www.pagesjaunes.fr\/pros\/detail?bloc_id=FCP57672837CLIENTDCESS000003C0001%26no_sequence=1%26code_rubrique=54053000",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*pagesjaunes\\.fr)?\/)?pros)?\/)?(\\d+)(?:\/\\w+)*\/?(?:[?#].*)?$",
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*pagesjaunes\\.fr)?\/)?pros)?\/)?detail\\?(?:\\w+=\\w*&)*bloc_id=[a-zA-Z]*(\\d{8})\\w*(?:&\\w+=\\w*)*(?:#.*)?$",
        ],
        "lowerCased": true,
    },
    "peer-spot": {
        "exampleUrl":
            "https:\/\/www.peerspot.com\/products\/checkmarx-one-reviews",
        "acceptableFormats": [
            "checkmarx-one",
            "checkmarx-one-reviews",
            "products\/checkmarx-one",
            "products\/checkmarx-one-reviews",
            "https:\/\/www.peerspot.com\/products\/checkmarx-one",
            "https:\/\/www.peerspot.com\/products\/checkmarx-one-reviews",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*peerspot(?:\\.[a-z]{2,3}){1,2})?\/)?products)?\/)?([-\\w]+?)(?:-reviews)?(?:\/[\\w-]+)*\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "practo": {
        "exampleUrl":
            "https:\/\/www.practo.com\/doctor\/dr-geeta-verma-gupta-dentist",
        "acceptableFormats": [
            "doctor\/dr-geeta-verma-gupta-dentist",
            "https:\/\/www.practo.com\/lucknow\/doctor\/dr-geeta-verma-gupta-dentist\/recent",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*(?:practo(?:\\.[a-z]{2,3}){1,2})?)?\/)?[\\w-]+)?\/)?((?:clinic|hospital|doctor)\/(?:[\\w-]+))(?:[?#\/].*)?$",
        ],
        "lowerCased": false,
    },
    "priceline": {
        "exampleUrl": "https:\/\/www.priceline.com\/relax\/at\/52129904",
        "acceptableFormats": [
            "52129904",
            "H52129904",
            "relax\/at\/52129904",
            "https:\/\/www.priceline.com\/relax\/at\/52129904",
            "https:\/\/www.priceline.com\/hotel-deals\/en-us\/P3000015284\/H20018604",
        ],
        "patterns": [
            "^(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*priceline(?:\\.[a-z]{2,3}){1,2})?\/)?(?:[\\w+-]+\/)*?)?H?(\\d+)\/?(?:[\\w+-.]+)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "product-hunt": {
        "exampleUrl": "https:\/\/www.producthunt.com\/products\/notionapps",
        "acceptableFormats": [
            "notionapps",
            "products\/notionapps",
            "https:\/\/www.producthunt.com\/products\/notionapps",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*producthunt(?:\\.[a-z]{2,3}){1,2})?\/)?products)?\/)?([-\\w]+)\/?(?:[?#\/].*)?$",
        ],
        "lowerCased": false,
    },
    "product-review": {
        "exampleUrl": "https:\/\/www.productreview.com.au\/listings\/lexus-rx",
        "acceptableFormats": [
            "lexus-rx",
            "listings\/lexus-rx",
            "https:\/\/www.productreview.com.au\/listings\/lexus-rx",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*productreview(?:\\.[a-z]{2,3}){1,2})?\/)?listings)?\/)?([-\\w]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "ratemds": {
        "exampleUrl":
            "https:\/\/www.ratemds.com\/doctor-ratings\/3178079\/CHRISTINE+A.-ADAMO-Coronado-CA.html",
        "acceptableFormats": [
            "doctor-ratings\/3178079\/CHRISTINE+A.-ADAMO-Coronado-CA.html",
            "doctor-ratings\/dr-aleena-fiorotto-huntsville-on-ca",
            "clinic\/us-fl-riviera-beach-kindred-hospital-the-palm-beaches",
            "hospital\/us-ca-westminster-kindred-hospital-orange-county",
            "https:\/\/www.ratemds.com\/doctor-ratings\/3178079\/CHRISTINE+A.-ADAMO-Coronado-CA.html\/",
            "https:\/\/www.ratemds.com\/amp\/doctor-ratings\/3182039\/dr-nkeiruka%20o.-dara-chicago-il.html\/",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*ratemds(?:\\.[a-z]{2,3}){1,2})?\/)?(?:[a-z-]{3,}\/)?([a-z-]{3,}\/(?:\\d+\/[\\w\\s+.&;'-]+\\.html|[\\w-]+(?!\/\\d)))(?:[?#\/].*)?$",
        ],
        "lowerCased": false,
    },
    "realself": {
        "exampleUrl":
            "https:\/\/www.realself.com\/dr\/robert-h-cohen-beverly-hills-ca",
        "acceptableFormats": [
            "dr\/robert-h-cohen-beverly-hills-ca",
            "practices\/ab-plastic-surgery-seoul-south-korea",
            "https:\/\/www.realself.com\/dr\/robert-h-cohen-beverly-hills-ca",
            "https:\/\/www.realself.com\/practices\/ab-plastic-surgery-seoul-south-korea",
        ],
        "patterns": [
            "^(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*?realself(?:\\.[a-z]{2,3}){1,2})?\/?((?:(?:dr|practices)\/)[-\\w\\s]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "rent": {
        "exampleUrl":
            "https:\/\/www.rent.com\/california\/los-angeles-apartments\/da-vinci-4-100050308",
        "acceptableFormats": [
            "1450-atlantic-shores-blvd-hallandale-beach-fl-lv2160399083",
            "da-vinci-4-100050308",
            "lv2160399083",
            "100050308",
            "los-angeles-apartments\/da-vinci-4-100050308",
            "california\/los-angeles-apartments\/da-vinci-4-100050308",
            "https:\/\/www.rent.com\/r\/1450-atlantic-shores-blvd-hallandale-beach-fl-lv2160399083",
            "https:\/\/www.rent.com\/california\/los-angeles-apartments\/da-vinci-4-100050308",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*rent(?:\\.[a-z]{2,3}){1,2})?\/)?(?:r|(?:[\\w-]+(?:\/[\\w-]+)?)))?\/)?((?:[\\w-]+-)?[a-z\\d]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "reseller-ratings": {
        "exampleUrl": "https:\/\/www.resellerratings.com\/store\/TK_Digitals",
        "acceptableFormats": [
            "TK_Digitals",
            "https:\/\/www.resellerratings.com\/store\/TK_Digitals",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*resellerratings(?:\\.[a-z]{2,3}){1,2})?\/)?store)?\/)?([-\\w]+)(?:\\(?:[?#\/].*)?$",
        ],
        "lowerCased": false,
    },
    "reviews-io": {
        "exampleUrl":
            "https:\/\/www.reviews.io\/company-reviews\/store\/www-facegym-com",
        "acceptableFormats": [
            "io\/company-reviews\/store\/www-facegym-com",
            "https:\/\/www.reviews.io\/company-reviews\/store\/www-facegym-com",
            "co.uk\/company-reviews\/store\/www-facegym-com",
            "https:\/\/www.reviews.co.uk\/company-reviews\/store\/www-facegym-com",
            "co.uk\/product-reviews\/store\/printstercouk\/5",
            "https:\/\/www.reviews.co.uk\/product-reviews\/store\/printstercouk\/5",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*reviews)?\\.)?((?:io|co\\.uk)\/(?:company|product)-reviews\/store\/[.\\w-]+(?:\/\\d+)?)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "site-jabber": {
        "exampleUrl": "https:\/\/www.sitejabber.com\/reviews\/afaa.com",
        "acceptableFormats": [
            "afaa.com",
            "reviews\/afaa.com",
            "https:\/\/www.sitejabber.com\/reviews\/afaa.com",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*sitejabber(?:\\.[a-z]{2,3}){1,2})?\/)?reviews)?\/)?([\\w.-]+)(?:\/\\w+)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "smyths-toys": {
        "exampleUrl":
            "https:\/\/www.smythstoys.com\/ie\/en-ie\/toys\/disney\/lego-disney\/lego-disney-43249-lilo-and-stitch-set\/p\/232240",
        "acceptableFormats": [
            "232240",
            "lego-disney-43249-lilo-and-stitch-set\/p\/232240",
            "https:\/\/www.smythstoys.com\/ie\/en-ie\/toys\/disney\/lego-disney\/lego-disney-43249-lilo-and-stitch-set\/p\/232240",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*smythstoys(?:\\.[a-z]{2,3}){1,2})?\/)?ie)?\/)?en-ie)?\/)?(?:[\\w-]+\/)*)?p)?\/)?(\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "software-advice": {
        "exampleUrl":
            "https:\/\/www.softwareadvice.com\/construction\/quickmeasure-profile",
        "acceptableFormats": [
            "quickmeasure",
            "quickmeasure-profile",
            "construction\/quickmeasure-profile",
            "softwareadvice.com\/construction\/quickmeasure-profile",
            "https:\/\/www.softwareadvice.com\/construction\/quickmeasure-profile",
            "https:\/\/www.softwareadvice.com\/product\/463789-SiteBook-Tradie",
            "https:\/\/www.softwareadvice.com.au\/software\/329752\/pressnxpress",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*softwareadvice(?:\\.[a-z]{2,3}){1,2})?\/)?[\\w-]+)?\/)?(?:\\d+\/)?(?:\\d*-)?([-\\w]+?)(?:-profile)?(?:\/[\\w-]+)*\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "solv": {
        "exampleUrl":
            "https:\/\/www.solvhealth.com\/carbon-health-urgent-care-los-angeles-ca-goQDkV",
        "acceptableFormats": [
            "carbon-health-urgent-care-los-angeles-ca-goQDkV",
            "goQDkV",
            "https:\/\/www.solvhealth.com\/carbon-health-urgent-care-los-angeles-ca-goQDkV",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*solvhealth(?:\\.[a-z]{2,3}){1,2})?\/)?((?:[\\w-]+-)?[\\w]+)(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "stayz": {
        "exampleUrl": "https:\/\/www.stayz.com.au\/pdp\/lo\/1217263",
        "acceptableFormats": [
            "pdp\/lo\/1217263",
            "https:\/\/www.stayz.com.au\/pdp\/lo\/1217263",
            "holiday-rental\/p2320528vb",
            "https:\/\/www.stayz.com.au\/holiday-rental\/p2320528vb",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*stayz\\.com.au)?\/)?((?:[\\w-]+\/)*[a-z]{0,2}\\d+[a-z]{0,2})\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "steam": {
        "exampleUrl":
            "https:\/\/store.steampowered.com\/app\/3016090\/Eternal_Escape_castle_of_shadows\/",
        "acceptableFormats": [
            "3016090",
            "3016090\/Eternal_Escape_castle_of_shadows\/",
            "app\/3016090\/Eternal_Escape_castle_of_shadows\/",
            "https:\/\/store.steampowered.com\/app\/3016090\/Eternal_Escape_castle_of_shadows\/",
            "https:\/\/steamcommunity.com\/app\/3016090\/reviews",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*(?:steampowered|steamcommunity)(?:\\.[a-z]{2,3}){1,2})?\/)?app)?\/)?(\\d+)(?:\/[\\w-]+)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "super-money": {
        "exampleUrl":
            "https:\/\/www.supermoney.com\/reviews\/beyond-finance-llc",
        "acceptableFormats": [
            "prosper-funding-llc",
            "reviews\/prosper-funding-llc",
            "https:\/\/www.supermoney.com\/reviews\/prosper-funding-llc",
            "https:\/\/www.supermoney.com\/reviews\/personal-credit-cards\/prosper-card",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*supermoney(?:\\.[a-z]{2,3}){1,2})?\/)?reviews)?\/)?(?:[-\\w]+\/)?([-\\w]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "takeaway": {
        "exampleUrl": "https:\/\/www.takeaway.com\/bar-a-pizza-charleroi",
        "acceptableFormats": [
            "takeaway.com\/be\/bar-a-pizza-charleroi",
            "takeaway.com\/be\/menu\/bar-a-pizza-charleroi",
            "https:\/\/www.takeaway.com\/be\/menu\/bar-a-pizza-charleroi",
            "takeaway.com\/lu\/menu\/hokkaido-sushi",
        ],
        "patterns": [
            "^(?:https?:\/\/)?(?:[\\w-]+\\.)*(takeaway\\.com\/(?:be|lu|bg)(?:-[a-z]{2})?(?:\/\\w+)?\/[\\w-]+)(?:\/?[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "talabat": {
        "exampleUrl":
            "https:\/\/www.talabat.com\/uae\/restaurant\/9372\/itsu-modern-japanese-restaurant",
        "acceptableFormats": [
            "uae\/itsu-modern-japanese-restaurant",
            "uae\/restaurant\/9372\/itsu-modern-japanese-restaurant",
            "egypt\/restaurant\/692279",
            "https:\/\/www.talabat.com\/uae\/restaurant\/9372\/itsu-modern-japanese-restaurant",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*talabat(?:\\.[a-z]{2,3}){1,2})?\/)?(?:[a-z]{2}\/)?([\\w-]+\/[\\w-]+(?:\/\\d+(?:\/[\\w-]+)?)?)\/?(?:[?#].*)?$",
        ],
    },
    "target": {
        "exampleUrl":
            "https:\/\/www.target.com\/p\/women-s-short-sleeve-ribbed-t-shirt-a-new-day\/-\/A-93531665",
        "acceptableFormats": [
            "93531665",
            "A-93531665",
            "-\/A-93531665",
            "women-s-short-sleeve-ribbed-t-shirt-a-new-day\/-\/A-93531665",
            "p\/women-s-short-sleeve-ribbed-t-shirt-a-new-day\/-\/A-93531665",
            "www.target.com\/p\/women-s-short-sleeve-ribbed-t-shirt-a-new-day\/-\/A-93531665",
            "https:\/\/www.target.com\/p\/women-s-short-sleeve-ribbed-t-shirt-a-new-day\/-\/A-93531665",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*target(?:\\.[a-z]{2,3}){1,2})?\/)?p)?\/)?((?:(?:(?:(?:(?:(?:[\\w-]+)?\/)?[\\w-]+)?\/)?\\w)?-)?\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "the-fork": {
        "exampleUrl":
            "https:\/\/www.thefork.com\/restaurant\/restaurant-the-vintage-sushi-and-more-r812024",
        "acceptableFormats": [
            "restaurant-the-vintage-sushi-and-more-r812024",
            "restaurant\/restaurant-the-vintage-sushi-and-more-r812024",
            "www.thefork.com\/restaurant\/restaurant-the-vintage-sushi-and-more-r812024",
            "https:\/\/www.thefork.com\/restaurant\/restaurant-the-vintage-sushi-and-more-r812024",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*thefork\\.com)\/restaurant\/|\/?restaurant\/|\/?)?([\\w-]+-r\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "the-knot": {
        "exampleUrl":
            "https:\/\/www.theknot.com\/marketplace\/the-lucerne-inn-dedham-me-424229",
        "acceptableFormats": [
            "424229",
            "the-lucerne-inn-dedham-me-424229",
            "marketplace\/the-lucerne-inn-dedham-me-424229",
            "theknot.com\/marketplace\/the-lucerne-inn-dedham-me-424229",
            "https:\/\/www.theknot.com\/marketplace\/the-lucerne-inn-dedham-me-424229",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*theknot(?:\\.[a-z]{2,3}){1,2})?\/)?marketplace)?\/)?([\\w.-]*\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "thuisbezorgd": {
        "exampleUrl": "https:\/\/www.thuisbezorgd.nl\/mana-mana-de-pijp",
        "acceptableFormats": [
            "thuisbezorgd.nl\/namche",
            "thuisbezorgd.nl\/menu\/namche",
            "https:\/\/www.thuisbezorgd.nl\/namche",
            "https:\/\/www.thuisbezorgd.nl\/boodschappen\/rembrandtpark-shop",
        ],
        "patterns": [
            "^(?:https?:\/\/)?(?:[\\w-]+\\.)*(thuisbezorgd\\.nl\/(?:(?:[a-z]{2}\/)?\\w+\/)?[\\w-]+)(?:\/?[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "thumbtack": {
        "exampleUrl":
            "https:\/\/www.thumbtack.com\/ca\/san-jose\/interior-designers\/inside-eye-design-studio\/service\/501014977851047937",
        "acceptableFormats": [
            "inside-eye-design-studio\/service\/501014977851047937",
            "501014977851047937",
            "ca\/san-jose\/interior-designers\/inside-eye-design-studio\/service\/501014977851047937",
            "https:\/\/www.thumbtack.com\/ca\/san-jose\/interior-designers\/inside-eye-design-studio\/service\/501014977851047937",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*thumbtack(?:\\.[a-z]{2,3}){1,2})?\/)?[\\w-]+)?\/)?[\\w-]+)?\/)?[\\w-]+)?\/)?((?:(?:(?:(?:[\\w-]+)?\/)?service)?\/)?\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "travelocity": {
        "exampleUrl":
            "https:\/\/www.travelocity.com\/Worcester-Hotels-Hilton-Garden-Inn-BostonMarlborough.h14833039.Hotel-Information",
        "acceptableFormats": [
            "Worcester-Hotels-Hilton-Garden-Inn-BostonMarlborough.h14833039.Hotel-Information",
            "https:\/\/www.travelocity.com\/Worcester-Hotels-Hilton-Garden-Inn-BostonMarlborough.h14833039.Hotel-Information",
            "Worcester-Hotels-Hilton-Garden-Inn-BostonMarlborough.h14833039",
            "h14833039",
            "14833039",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*travelocity(?:\\.[a-z]{2,3}){1,2})?\/)?((?:[-+%_\\p{L}\\p{N}',\"]+\\.)?h?\\d+(?:\\.[-+%_\\p{L}\\p{N}',\"]+)?)\/?(?:[?#].*)?",
        ],
        "lowerCased": false,
    },
    "treat-well": {
        "exampleUrl": "https:\/\/www.treatwell.fr\/salon\/le-secret-du-barbier",
        "acceptableFormats": [
            "treatwell.fr\/salon\/le-secret-du-barbier",
            "https:\/\/www.treatwell.fr\/salon\/le-secret-du-barbier",
            "treatwell.co.uk\/place\/le-secret-du-barbier",
            "treatwell.lt\/salonas\/masazo-terapeutas-mikolajus",
            "treatwell.be\/salon\/kapsalon-c-hair",
            "treatwell.de\/ort\/barberremz",
            "treatwell.es\/establecimiento\/la-estetica-fransuar",
            "treatwell.gr\/katasthma\/mr-lenorman",
            "treatwell.ie\/place\/organic-keratin-powered-by-zoneabeautyrepublik",
            "treatwell.it\/salone\/alezon-salon-hair-couture",
            "treatwell.nl\/salon\/barbershop1059",
            "treatwell.at\/ort\/cut2be-1",
            "treatwell.pt\/estabelecimento\/barbearia1025",
            "treatwell.ch\/ort\/art-of-beauty-11",
            "treatwell.ch\/fr\/salon\/art-of-beauty-11",
        ],
        "patterns": [
            "^(?:https?:\/\/)?(?:[\\w-]+\\.)*(treatwell(?:\\.[a-z]{2,3}){1,2}(?:\/[A-Z]{2})?\/[a-z]+\/[-+%_\\p{L}\\p{N}',\"]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "trip": {
        "exampleUrl":
            "https:\/\/www.trip.com\/hotels\/tunis-hotel-detail-78988468",
        "acceptableFormats": [
            "78988468",
            "https:\/\/www.trip.com\/hotels\/tunis-hotel-detail-78988468",
            "hotelId=78988468",
            "https:\/\/us.trip.com\/hotels\/detail\/?hotelId=78988468",
            "https:\/\/us.trip.com\/things-to-do\/detail\/69614885",
            "things-to-do\/detail\/69614885",
            "detail\/69614885",
            "https:\/\/www.trip.com\/travel-guide\/attraction\/hong-kong\/ocean-park-hong-kong-10558616",
            "attraction\/hong-kong\/ocean-park-hong-kong-10558616",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*trip(?:\\.[a-z]{2,3}){1,2})?\/)?travel-guide)?\/)?(attraction\/[\\w-]+\/[\\w-]+-\\d+)\/?(?:[?#].*)?$",
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*trip(?:\\.[a-z]{2,3}){1,2})?\/)?things-to-do)?\/)?(detail\/\\d+)\/?(?:[?#].*)?$",
            "^(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*trip(?:\\.[a-z]{2,3}){1,2})?\/)?hotels)?\/)?detail)?\/)?\\?.*)?(hotelId=\\d+).*$",
            "^(?:(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*trip(?:\\.[a-z]{2,3}){1,2})?\/)?hotels)?\/)?[\\w-]+-)?detail)?-)?(\\d+)(?:\/[\\w-]+)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "tripadvisor": {
        "exampleUrl":
            "https:\/\/www.tripadvisor.com\/Restaurant_Review-g53957-d4838236-Reviews-Top_of_the_80_s-West_Hazleton_Luzerne_County_Pocono_Mountains_Region_Pennsylvania.html",
        "acceptableFormats": [
            "g53957-d4838236",
            "https:\/\/www.tripadvisor.com\/Restaurant_Review-g53957-d4838236-Reviews-Top_of_the_80_s-West_Hazleton_Luzerne_County_Pocono_Mountains_Region_Pennsylvania.html",
            "Restaurant_Review-g53957-d4838236-Reviews-Top_of_the_80_s-West_Hazleton_Luzerne_County_Pocono_Mountains_Region_Pennsylvania.html",
            "d4838236",
            "4838236",
        ],
        "patterns": [
            "^(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*tripadvisor(?:\\.[a-z]{2,3}){1,2})?\/)?\\w+review-)?(g\\d+-d\\d+)(?:-[\\w-]+\\.html\/?(?:[?#].*)?)?$",
            "^(?:\\w+review-)?(g\\d+-d\\d+)(?:-reviews-[\\w-]+(?:\\.html\/?(?:[?#].*)?)?)?$",
            "^(?:g\\d+-)?d?(\\d+)$",
        ],
        "lowerCased": true,
    },
    "trusted-shops": {
        "exampleUrl": "https:\/\/www.trstd.com\/nl-nl\/reviews\/feestwinkel-nl",
        "acceptableFormats": [
            "de\/bewertung\/info_X16AE36093C7AABEB598B22D499FE2D1D",
            "https:\/\/www.trustedshops.de\/bewertung\/info_X16AE36093C7AABEB598B22D499FE2D1D",
            "com\/nl-nl\/reviews\/feestwinkel-nl",
            "https:\/\/www.trstd.com\/nl-nl\/reviews\/feestwinkel-nl",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*(?:trustedshops|trstd))?\\.)?([a-z]{2,3}(?:\\.[a-z]{2,3})?\/(?:[a-z]{2}-[a-z]{2}\/)?[-\\w]+\/[-\\w.]+?)(?:\\.html)?\/?(?:[?#].*)?$",
        ],
    },
    "trustpilot": {
        "exampleUrl": "https:\/\/www.trustpilot.com\/review\/trustpilot.com",
        "acceptableFormats": [
            "trustpilot.com",
            "https:\/\/www.trustpilot.fr\/review\/trustpilot.com",
            "https:\/\/fr.trustpilot.com\/review\/trustpilot.com",
            "trustpilot.com\/review\/www.trustpilot.com",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*trustpilot(?:\\.[a-z]{2,3}){1,2})?\/review\/)?([\\w.-]+(?:\/(?!transparency\\b)\\w+)*)(?:\/transparency)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "trust-radius": {
        "exampleUrl": "https:\/\/www.trustradius.com\/products\/clari",
        "acceptableFormats": [
            "clari",
            "clari\/reviews",
            "products\/clari",
            "products\/clari\/reviews",
            "trustradius.com\/products\/clari",
            "www.trustradius.com\/products\/clari\/reviews",
            "https:\/\/www.trustradius.com\/products\/clari",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*trustradius(?:\\.[a-z]{2,3}){1,2})?\/)?products)?\/)?([-\\w]+)(?:\/[\\w-]+)*\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "ubereats": {
        "exampleUrl":
            "https:\/\/www.ubereats.com\/store\/kfc-2400-louis-xiv\/YexrviO9V_GNGHXnEojF2A",
        "acceptableFormats": [
            "kfc-2400-louis-xiv\/YexrviO9V_GNGHXnEojF2A",
            "YexrviO9V_GNGHXnEojF2A",
            "https:\/\/www.ubereats.com\/store\/kfc-2400-louis-xiv\/YexrviO9V_GNGHXnEojF2A",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*ubereats(?:\\.[a-z]{2,3}){1,2})?\/)?(?:[a-z]{2}(?:-[a-z]{2})?\/)?store)?\/)?([\\w\u2013:&+!-]+))?\/)?([\\w-]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "vitals": {
        "exampleUrl":
            "https:\/\/www.vitals.com\/doctors\/Dr_Mickey_Coffler.html",
        "acceptableFormats": [
            "doctors\/Dr_Mickey_Coffler",
            "doctors\/1x5p6w\/natalie-jay",
            "https:\/\/www.vitals.com\/doctors\/Dr_Mickey_Coffler.html",
            "https:\/\/www.vitals.com\/dentists\/Dr_Susan_Vivien_Chadkewicz",
            "https:\/\/www.vitals.com\/practice\/wills-eye-surgery-center-352fc2c7-4703-e211-a42b-001f29e3eb44",
            "https:\/\/www.vitals.com\/hospital\/martin-luther-king-jr-community-hospital-9b26e520-e191-456a-934a-3c008ad2fd48",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*vitals(?:\\.[a-z]{2,3}){1,2})?\/)?((?:[a-z]+)(?:\/[0-9a-z]{6})?\/[\\w-]+)(?:\\.html)?(?:[?#\/].*)?$",
        ],
        "lowerCased": false,
    },
    "vrbo": {
        "exampleUrl": "https:\/\/www.vrbo.com\/pdp\/lo\/1217263",
        "acceptableFormats": [
            "2937459",
            "https:\/\/www.vrbo.com\/2937459",
            "pdp\/lo\/1217263",
            "https:\/\/www.vrbo.com\/pdp\/lo\/1217263",
            "en-sg\/p1469363a",
            "https:\/\/www.vrbo.com\/en-sg\/p1469363a",
            "en-ca\/cottage-rental\/p2320528vb",
            "https:\/\/www.vrbo.com\/en-ca\/cottage-rental\/p2320528vb",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*vrbo\\.com)?\/)?((?:[\\w-]+\/)*[a-z]{0,2}\\d+[a-z]{0,2})\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "walmart": {
        "exampleUrl":
            "https:\/\/www.walmart.com\/ip\/232XL-Ink-Cartridges-Epson-232XL-232-T232-Ink-Workforce-WF-2930-WF-2950-Expression-XP-4200-XP-4205-Printer-Black-Cyan-Magenta-Yellow-5-Pack\/5112777712",
        "acceptableFormats": [
            "5112777712",
            "232XL-Ink-Cartridges-Epson-232XL-232-T232-Ink-Workforce-WF-2930-WF-2950-Expression-XP-4200-XP-4205-Printer-Black-Cyan-Magenta-Yellow-5-Pack\/5112777712",
            "ip\/232XL-Ink-Cartridges-Epson-232XL-232-T232-Ink-Workforce-WF-2930-WF-2950-Expression-XP-4200-XP-4205-Printer-Black-Cyan-Magenta-Yellow-5-Pack\/5112777712",
            "https:\/\/www.walmart.com\/ip\/232XL-Ink-Cartridges-Epson-232XL-232-T232-Ink-Workforce-WF-2930-WF-2950-Expression-XP-4200-XP-4205-Printer-Black-Cyan-Magenta-Yellow-5-Pack\/5112777712",
        ],
        "patterns": [
            "^(?:(?:https?:\/\/)?(?:[\\w-]+.)?walmart\\.[a-z]{2,})?(?:\/?(?:(?:ip|product|reviews\/product)\/)?(?:[\\w-]+\/)*)?(\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "webmd": {
        "exampleUrl":
            "https:\/\/doctor.webmd.com\/doctor\/semira-bayati-13f92f7f-cc8d-419f-8bbc-1b44c77c6d89",
        "acceptableFormats": [
            "doctor\/semira-bayati-13f92f7f-cc8d-419f-8bbc-1b44c77c6d89",
            "practice\/roxana-r-sayah-dds-4a8eeb83-c7ea-4e1c-8d5b-0c1cca371576",
            "hospital\/college-hospital-cerritos-33866415-4e22-4424-af80-79c842223748",
            "https:\/\/doctor.webmd.com\/doctor\/semira-bayati-13f92f7f-cc8d-419f-8bbc-1b44c77c6d89",
            "https:\/\/doctor.webmd.com\/doctor\/semira-bayati-13f92f7f-cc8d-419f-8bbc-1b44c77c6d89-overview",
            "https:\/\/doctor.webmd.com\/doctor\/semira-bayati-13f92f7f-cc8d-419f-8bbc-1b44c77c6d89\/reviews",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?doctor\\.webmd(?:\\.[a-z]{2,3}){1,2})?\/)?((?:doctor|practice|hospital)\/(?:\\w+-)+[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-[a-z]+)?(?:[?#\/].*)?$",
        ],
        "lowerCased": false,
    },
    "wedding-wire": {
        "exampleUrl":
            "https:\/\/www.weddingwire.com\/biz\/north-shore-house\/28b3e0f05b36bce3.html",
        "acceptableFormats": [
            "weddingwire.com\/28b3e0f05b36bce3",
            "weddingwire.com\/biz\/north-shore-house\/28b3e0f05b36bce3.html",
            "https:\/\/www.weddingwire.com\/biz\/north-shore-house\/28b3e0f05b36bce3.html",
            "https:\/\/www.weddingwire.ca\/wedding-banquet-halls\/the-doctors-house--e10815",
            "https:\/\/www.weddingwire.in\/wedding-lawns-farmhouses\/rajkamal-palace--e477932",
        ],
        "patterns": [
            "^(?:https?:\/\/)?(?:[\\w-]+\\.)*(weddingwire(?:\\.[a-z]{2,3}){1,2})\/(?:[\\w-]+\/)?(?:[\\w-]+\/)?([&\\w-]+)(?:\\.html)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "yell": {
        "exampleUrl":
            "https:\/\/www.yell.com\/biz\/andreas-pizzeria-bedford-1889996",
        "acceptableFormats": [
            "andreas-pizzeria-bedford-1889996",
            "biz\/andreas-pizzeria-bedford-1889996",
            "yell.com\/biz\/andreas-pizzeria-bedford-1889996",
            "https:\/\/www.yell.com\/biz\/andreas-pizzeria-bedford-1889996",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*yell(?:\\.[a-z]{2,3}){1,2})?\/)?biz)?\/)?([\\w-]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "yellowpages": {
        "exampleUrl":
            "https:\/\/www.yellowpages.com\/houston-tx\/mip\/the-auto-doc-8519899",
        "acceptableFormats": [
            "the-auto-doc-8519899",
            "https:\/\/www.yellowpages.com\/houston-tx\/mip\/the-auto-doc-8519899",
            "https:\/\/www.yellowpages.com\/houston-tx\/l\/8519899",
            "houston-tx\/mip\/the-auto-doc-8519899",
            "8519899",
        ],
        "patterns": [
            "^(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*yellowpages\\.com)?\/)?(?:[-+%_\\p{L}\\p{N}',\"]+\/(?:mip|bp)\/|l\/))?((?:[-+%_\\p{L}\\p{N}',\"]+-)?\\d+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": true,
    },
    "yelp": {
        "exampleUrl":
            "https:\/\/www.yelp.com\/biz\/the-cheesecake-factory-san-diego",
        "acceptableFormats": [
            "the-cheesecake-factory-san-diego",
            "https:\/\/www.yelp.com\/biz\/the-cheesecake-factory-san-diego",
        ],
        "patterns": [
            "^(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*yelp(?:\\.[a-z]{2,3}){1,2}\/biz\/)?([-+%_\\p{L}\\p{N}',\"]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "zillow": {
        "exampleUrl": "https:\/\/www.zillow.com\/profile\/oakandocean",
        "acceptableFormats": [
            "oakandocean",
            "https:\/\/www.zillow.com\/profile\/oakandocean",
            "https:\/\/www.zillow.com\/lender-profile\/LenderGreg",
        ],
        "patterns": [
            "^(?:(?:(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*zillow(?:\\.[a-z]{2,3}){1,2})?\/)?(?:lender-)?profile)?\/)?([-\\w \\t]+)\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
    "zocdoc": {
        "exampleUrl": "https:\/\/www.zocdoc.com\/doctor\/leslie-lu-md-339006",
        "acceptableFormats": [
            "leslie-lu-md-339006",
            "339006",
            "doctor\/leslie-lu-md-339006",
            "https:\/\/www.zocdoc.com\/doctor\/leslie-lu-md-339006",
            "https:\/\/www.zocdoc.com\/dentist\/leslie-lu-md-339006",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*zocdoc(?:\\.[a-z]{2,3}){1,2})?\/)?((?:[a-z]+\/)?(?:\\w+-)*\\d+)(?:[?#\/].*)?$",
        ],
        "lowerCased": false,
    },
    "zomato": {
        "exampleUrl":
            "https:\/\/www.zomato.com\/abudhabi\/payyannur-restaurant-1-al-markaziya\/reviews",
        "acceptableFormats": [
            "abudhabi\/payyannur-restaurant-1-al-markaziya",
            "https:\/\/www.zomato.com\/abudhabi\/payyannur-restaurant-1-al-markaziya\/reviews",
            "https:\/\/www.zomato.com\/tr\/abudhabi\/payyannur-restaurant-1-al-markaziya\/reviews",
        ],
        "patterns": [
            "^(?:(?:(?:https?:\/\/)?(?:[\\w-]+\\.)*zomato\\.com)?\/)?(?:[a-z]{2}\/)?([\\w-]+\/[\\w-]+)(?:\/[a-z]+)?\/?(?:[?#].*)?$",
        ],
        "lowerCased": false,
    },
};
