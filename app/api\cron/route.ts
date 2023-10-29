import connectToDB from 
import scrapeAmazonProduct
import getLowestPrice
import getHighestPrice
import getAveragePrice
import Product


export async function GET() {
    try {
        connectToDB();

        const products= await CSSMathProduct.find({});

        if(!products) throw new Error("No products found");

        // 1. SCRAPE LATEST PRODUCT DETAILS & UPDATE DB
        const updatedProducts = await Promise.all(
            products.map(async (currentProduct) =>{
                const scrapeProduct = await scrapeAmazonProduct (currentProduct.url);

                if(!scrapeProduct) throw new Error("No product found")

                const updatedPriceHistory = [
                    ...currentProduct.priceHistory,
                    {price: scrapedProduct.currentPrice}
                ]
    
                const product = {
                    ...scrapedProduct,
                    priceHistory: updatedPriceHistory,
                    lowestPrice: getLowestPrice(updatedPriceHistory),
                    highestPrice: getHighestPrice(updatedPriceHistory),
                    averagePrice: getAveragePrice(updatedPriceHistory),
    
                }
            
    
                const updatedProduct= await Product.findOneAndUpdate({
                    {url: scrapedProduct.url},
                    product,
                });

                // 2. CHECK EACH PRODUCT'S STATUS & SEND EMAIL ACCORDINGLY 
                const emailNotifType = getEmailNotifType(scrapeProduct, currentProduct)

                if (emailNotifType && updatedProduct.users.length > 0) {
                    const productInfo = {
                        title: updatedProduct.title,
                        url: updatedProduct.url,
                    }

                    const emailContent = await generateEmailBody(productInfo, emailNotifType);

                    const userEmails= updatedProduct.users.map((users:any) => user.email);

                    await sendEmail(emailContent, userEmails);
                }
                return updatedProduct
            })
        ) 
        
        return NextResponse.json({
            message: 'Ok', data: updatedProducts
        })

    } catch (error) {
        throw new Error(`Error in GET: ${error}`)
    }
}