const Product = require("../models/product.model");
const Section = require("../models/section.model");

module.exports.addSection = async (req, res) => {
  try {
    if (req.method != "POST") {
      return res.status(405).json({
        status: 405,
        message: "Methods is not allowed.",
      });
    }
    await Section.create({
      section_name: req.body.sectionName,
    });
    return res.status(200).json({
      status: 200,
      message: "New section added.",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error,
    });
  }
};
module.exports.setSectionId = async (req, res) => {
  try {
    if (req.method != "POST") {
      return res.status(405).json({
        status: 405,
        message: "Methods is not allowed.",
      });
    }
    await Product.update(
      { sectionId: req.body.sectionId },
      { where: { id: req.body.productId } }
    );
    return res.status(200).json({
      status: 200,
      message: "Add product into the section.",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error,
    });
  }
};
module.exports.getSection = async (req, res) => {
  try {
    if (req.method != "GET") {
      return res.status(405).json({
        status: 405,
        message: "Methods is not allowed.",
      });
    }

    let sections = await Section.findAll();
    let result=[];
    let sectionPromises = sections.map(async(section) => {
      const product = await Product.findAll({ where: { sectionId: section.id } });
      let homeSection = {};
      homeSection.id = section.id;
      homeSection.section_name = section.section_name;
      homeSection.products = JSON.parse(JSON.stringify(product));
      result.push(homeSection);
    });
    await Promise.all(sectionPromises);
    return res.status(200).json({
      status: 200,
      result: result,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error,
    });
  }
};
