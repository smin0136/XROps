export default [
  {
    tileSource: {
      "@context": "http://iiif.io/api/image/2/context.json",
      "@id": "https://dlcs.io/iiif-img/wellcome/5/b18035723_0001.JP2",
      protocol: "http://iiif.io/api/image",
      width: 2569,
      height: 3543,
      tiles: [
        {
          width: 256,
          height: 256,
          scaleFactors: [1, 2, 4, 8, 16],
        },
      ],
      sizes: [
        {
          width: 725,
          height: 1000,
        },
        {
          width: 290,
          height: 400,
        },
        {
          width: 145,
          height: 200,
        },
        {
          width: 73,
          height: 100,
        },
      ],
      profile: [
        "http://iiif.io/api/image/2/level1.json",
        {
          formats: ["jpg"],
          qualities: ["native", "color", "gray"],
          supports: [
            "regionByPct",
            "sizeByForcedWh",
            "sizeByWh",
            "sizeAboveFull",
            "rotationBy90s",
            "mirroring",
            "gray",
          ],
        },
      ],
    },
  },
];
