// Allow side-effect imports for CSS files
declare module "*.css";

// CSS modules (if using *.module.css)
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}