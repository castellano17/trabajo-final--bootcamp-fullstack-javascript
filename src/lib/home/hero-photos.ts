export type HeroPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const heroPhotos: HeroPhoto[] = [
  {
    src: "/images/tacos-callejeros.webp",
    alt: "Tacos callejeros con cebolla, cilantro y limón en una caja para llevar",
    width: 1000,
    height: 1500,
  },
  {
    src: "/images/tacos-con-limon.webp",
    alt: "Tacos de carne con cilantro, rábano y limón sobre papel",
    width: 1600,
    height: 1066,
  },
  {
    src: "/images/letrero-de-tacos.webp",
    alt: "Letrero de neón con la palabra TACOS en una taquería de noche",
    width: 1600,
    height: 1067,
  },
];
