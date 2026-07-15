import { Request, Response, NextFunction } from "express";

import {
  createComplimentCategoryService,
  getAllComplimentCategoryService,
  getComplimentCategoryByIdService,
  updateComplimentCategoryService,
  deleteComplimentCategoryService,
  createComplimentIdeaService,
  getAllComplimentIdeaService,
  getComplimentIdeaByCategoryService,
  getComplimentIdeaByIdService,
  updateComplimentIdeaService,
  deleteComplimentIdeaService,
} from "./compliment.service";


import {
  createComplimentCategorySchema,
  updateComplimentCategorySchema,
  createComplimentIdeaSchema,
  updateComplimentIdeaSchema,
} from "./compliment.validation";



// =================================================
// CATEGORY CONTROLLERS
// =================================================


// Create Category
export const createComplimentCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const payload =
      createComplimentCategorySchema.parse(req.body);


    const category =
      await createComplimentCategoryService(payload);


    return res.status(201).json({
      success: true,
      message: "Compliment category created successfully",
      data: category,
    });


  } catch (error) {
    next(error);
  }
};



// Get All Category
export const getAllComplimentCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {


    const categories =
      await getAllComplimentCategoryService();


    return res.status(200).json({
      success: true,
      data: categories,
    });


  } catch (error) {
    next(error);
  }
};



// Get Category By Id
export const getComplimentCategoryByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const id = req.params.id as string;


    const category =
      await getComplimentCategoryByIdService(id);



    return res.status(200).json({
      success: true,
      data: category,
    });


  } catch(error){
    next(error);
  }

};



// Update Category
export const updateComplimentCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {


    const id = req.params.id as string;


    const payload =
      updateComplimentCategorySchema.parse(req.body);



    const category =
      await updateComplimentCategoryService(
        id,
        payload
      );



    return res.status(200).json({
      success:true,
      message:"Compliment category updated successfully",
      data:category
    });



  } catch(error){
    next(error);
  }

};



// Delete Category
export const deleteComplimentCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const id = req.params.id as string;


    const result =
      await deleteComplimentCategoryService(id);



    return res.status(200).json({
      success:true,
      message:result.message
    });



  } catch(error){
    next(error);
  }

};






// =================================================
// IDEA CONTROLLERS
// =================================================


// Create Idea
export const createComplimentIdeaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {


    const payload =
      createComplimentIdeaSchema.parse(req.body);



    const idea =
      await createComplimentIdeaService(payload);



    return res.status(201).json({
      success:true,
      message:"Compliment idea created successfully",
      data:idea
    });


  } catch(error){
    next(error);
  }

};




// Get All Ideas
export const getAllComplimentIdeaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {


    const ideas =
      await getAllComplimentIdeaService();



    return res.status(200).json({
      success:true,
      data:ideas
    });


  } catch(error){
    next(error);
  }

};




// Get Ideas By Category
export const getComplimentIdeaByCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {


    const categoryId =
      req.params.categoryId as string;



    const ideas =
      await getComplimentIdeaByCategoryService(
        categoryId
      );



    return res.status(200).json({
      success:true,
      data:ideas
    });


  } catch(error){
    next(error);
  }

};




// Get Idea By ID
export const getComplimentIdeaByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {


    const id =
      req.params.id as string;



    const idea =
      await getComplimentIdeaByIdService(id);



    return res.status(200).json({
      success:true,
      data:idea
    });



  } catch(error){
    next(error);
  }

};




// Update Idea
export const updateComplimentIdeaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {


    const id =
      req.params.id as string;



    const payload =
      updateComplimentIdeaSchema.parse(req.body);



    const idea =
      await updateComplimentIdeaService(
        id,
        payload
      );



    return res.status(200).json({
      success:true,
      message:"Compliment idea updated successfully",
      data:idea
    });



  } catch(error){
    next(error);
  }

};




// Delete Idea
export const deleteComplimentIdeaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {


    const id =
      req.params.id as string;



    const result =
      await deleteComplimentIdeaService(id);



    return res.status(200).json({
      success:true,
      message:result.message
    });



  } catch(error){
    next(error);
  }

};