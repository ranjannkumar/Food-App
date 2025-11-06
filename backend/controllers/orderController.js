import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import stripe from '../config/stripe.js'; 


//placing user order for frontend
const placeOrder=async(req,res)=>{
    const frontend_url = process.env.CLIENT_URL ; 

    try{
        const newOrder = new orderModel({
            userId: req.user.id, 
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.user.id, {cartData:{}});

          // payment link using stripe
        const line_items = req.body.items.map((item)=>({
            price_data:{
                currency:"usd",
                product_data:{
                    name:item.name
                },
                unit_amount:item.price*100
            },
            quantity:item.quantity
        }))

         line_items.push({
            price_data:{
                currency:"usd",
                product_data:{
                    name:"Delivery Charges"
                },
                unit_amount:2*100
            },
            quantity:1
        })

         const session = await stripe.checkout.sessions.create({
            line_items:line_items,
            mode:'payment',
            success_url:`${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:`${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
        })
         res.json({success:true,session_url:session.url})
    }
    catch(error){
        console.log("Error placing order:", error);
        res.json({success:false, message:"Error"})
    }


}

const verifyOrder = async(req,res)=>{
    const {orderId,success} =req.body; 
     try {
        if(success=="true"){
            await orderModel.findByIdAndUpdate(orderId,{payment:true});
            res.json({success:true, message:"Paid"})
        }
        else{
            await orderModel.findByIdAndDelete(orderId);
            res.json({success:false,message:"Not Paid"})
        }
    }
    catch(error){
        console.log(error);
        res.json({success:false,message:"Error"})


    }}

    // user orders for frontend
    const userOrders = async(req,res)=>{
    try {
        if (!req.user || !req.user.id) {
            return res.json({ success: false, message: "Authentication required to fetch user orders." });
        }
        const userId = req.user.id;
        const orders = await orderModel.find({userId:userId}); 
        res.json({success:true,data:orders})
    } catch (error) {
        res.json({success:false,message:"Error fetching user orders"})
    }
}
  //Listing orders for admin panel
 const listOrders = async (req,res)=>{
    try {
        const orders = await orderModel.find({});
        res.json({success:true,data:orders})
    } catch (error) {
        res.json({success:false,message:"Error listing orders"})
    }
}

//api for updating order status
 const updateStatus = async (req,res) =>{
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status});
        res.json({success:true,message:"Status Updated"})
    } catch (error) {
        res.json({success:false,message:"Error updating status"})
    }
}


export{placeOrder, verifyOrder, userOrders,listOrders,updateStatus}