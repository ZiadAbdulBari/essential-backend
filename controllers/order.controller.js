const { uuid } = require("uuidv4");
const date = require("date-and-time");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const OrderItem = require("../models/order_item.model");
const Payment = require("../models/payment.model");
const Product = require("../models/product.model");
const ShippingAddress = require("../models/shipping_address.model");
const ProductVariant = require("../models/product_variant.model");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
module.exports.addShippingAddress = async (req, res) => {
  try {
    if (req.method != "POST") {
      return res.status(405).json({
        status: 405,
        message: "Methods is not allowed.",
      });
    }
    const newShippingAddress = {
      receiver_name: req.body.name,
      receiver_phone: req.body.phone,
      receiver_address: req.body.address,
      receiver_email: req.body.email,
      is_gift: req.body.gift,
      message: req.body.message,
      userId: req.id,
    };
    await ShippingAddress.create(newShippingAddress);
    return res.status(200).json({
      status: 200,
      message: "New shipping address added.",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error,
    });
  }
};
module.exports.getShippingAddress = async (req, res) => {
  try {
    if (req.method != "GET") {
      return res.status(405).json({
        status: 405,
        message: "Methods is not allowed.",
      });
    }
    const allAddress = await ShippingAddress.findAll({ userId: req.id });
    return res.status(200).json({
      status: 200,
      shipping_address: allAddress,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error,
    });
  }
};
module.exports.deleteShippingAddress = async (req, res) => {
  try {
    if (req.method != "POST") {
      return res.status(405).json({
        status: 405,
        message: "Method is not allowed.",
      });
    }

    await ShippingAddress.destroy({
      where: { id: req.body.id },
      force: true,
      truncate: false,
    });
    return res.status(200).json({
      status: 200,
      message: "Address has been deleted.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error,
    });
  }
};
module.exports.placeOrder = async (req, res) => {
  try {
    // DATA FORMET
    // ======================
    // {
    //     status:"pending",
    //     total_price:req.body.total_price,
    //     shippingaddressId:req.body.shippingId,
    //     userId:req.id,
    //     orderedProduct:req.body.products,
    //     medium:req.body.medium,
    // }
    const orderNumber = Math.floor(Math.random() * 90000) + 100000;
    const now = new Date();
    const deliveryDate = date.addDays(now, 4);
    const order = await Order.create({
      status: "Pending",
      total_price: req.body.total_price,
      order_number: orderNumber,
      estimated_delivery: deliveryDate,
      shippingaddressId: req.body.shippingaddressId,
      userId: req.id,
    });
    const orderedProduct = req.body.products;
    const stripePayment = [];
    orderedProduct.map(async (product) => {
      const newProduct = {
        quantity: parseInt(product.cart_quantity),
        title: product.title,
        image: product.image_url,
        price_at_purchase: product.price,
        productId: product.id,
        orderId: order.id,
        productVariantId: product.productVariantId,
        variants: product.variants,
      };
      const newStripeProduct = {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.title,
            images: [product.image_url],
            metadata: {
              id: product.id,
            },
          },
          unit_amount: product.price,
        },
        quantity: product.cart_quantity,
      };
      stripePayment.push(newStripeProduct);
      await OrderItem.create(newProduct);
      await Product.increment(
        { stock_quantity: -parseInt(product.cart_quantity) },
        { where: { id: product.id } }
      );
      await ProductVariant.increment(
        { stock: -parseInt(product.cart_quantity) },
        { where: { id: product.productVariantId } }
      );
    });
    await Payment.create({
      orderId: order.id,
      medium: req.body.medium,
      payment_status: req.body.paymentStatus,
    });
    await Cart.destroy({
      where: {
        userId: req.id,
      },
    });
    if (req.body.medium == "stripe") {
      const session = await stripe.checkout.sessions.create({
        line_items: stripePayment,
        mode: "payment",
        success_url: `http://localhost:3000/success/${order.id}`,
        cancel_url: `http://localhost:3000/cancle/${order.id}`,
      });
      // res.redirect(303, session.url);
      return res.status(200).json({
        status: 200,
        payment_url: session.url,
      });
    } else {
      return res.status(200).json({
        status: 200,
        message: "Order placed successfull",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};
module.exports.orderList = async (req, res) => {
  try {
    if (req.method != "GET") {
      return res.status(405).json({
        status: 405,
        message: "Method is not allowed.",
      });
    }
    const orders = await Order.findAll({ userId: req.id });
    return res.status(200).json({
      status: 200,
      order_list: orders,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error,
    });
  }
};
module.exports.changePaymentStatus = async (req, res) => {
  try {
    if (req.method != "POST") {
      return res.status(405).json({
        status: 405,
        message: "Method is not allowed.",
      });
    }
    const orderId = req.body.id;
    await Payment.update({payment_status:'successfull'},{where:{orderId:orderId}})
    return res.status(200).json({
      status: 200,
      message: "Payment successfull",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error,
    });
  }
};
