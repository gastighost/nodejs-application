const Product = require("../models/product");
const Order = require("../models/order");
const fs = require("fs");
const path = require("path");

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const { productId } = req.params;
  Product.findById(productId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const { productId } = req.body;
  Product.findById(productId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log("Added item", result);
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  // let fetchedCart;
  // let newQuantity = 1;
  // req.user
  //   .getCart()
  //   .then((cart) => {
  //     fetchedCart = cart;
  //     return cart.getProducts({ where: { id: productId } });
  //   })
  //   .then((products) => {
  //     let product;
  //     if (products.length > 0) {
  //       product = products[0];
  //     }
  //     if (product) {
  //       const oldQuantity = product.cartItem.quantity;
  //       newQuantity = oldQuantity + 1;
  //       return product;
  //     }
  //     return Product.findByPk(productId);
  //   })
  //   .then((product) => {
  //     return fetchedCart.addProduct(product, {
  //       through: {
  //         quantity: newQuantity,
  //       },
  //     });
  //   })
  //   .then(() => {
  //     res.redirect("/cart");
  //   })
  //   .catch((error) => console.log(error));
};

exports.postCartDeleteProduct = (req, res, next) => {
  const { productId } = req.body;
  req.user
    .removeFromCart(productId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((item) => {
        return { quantity: item.quantity, product: { ...item.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => res.redirect("/orders"))
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const { orderId } = req.params;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found."));
      }

      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("User is unauthorized"));
      }

      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);
      fs.readFile(invoicePath, (err, buffer) => {
        if (err) {
          return next(err);
        }
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'inline; filename="' + invoiceName + '"'
        );
        res.send(buffer);
      });
    })
    .catch((error) => next(error));
};
