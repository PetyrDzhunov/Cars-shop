const router = require('express').Router();
const carService = require('../services/cars-service');
const userService = require('../services/user-service');
const { parseError } = require('../utils/parsers');
const { isUser } = require('../middlewares/guards-middleware');

router.get('/create', async(req, res) => {
    const {budget} = await userService.getBudgetById(req.user._id);
    res.render('cars/create', { title: 'Create new car for sale' ,budget});
});

router.post('/create', isUser, async(req, res) => {
    const { brand, model, region, yearOfManufacture, engine, gearbox, imageUrl, price } = req.body;
    try {
        
        const car = await carService.createOffer({ brand, model, region, yearOfManufacture, engine, gearbox, imageUrl, price, owner: req.user._id });
        res.redirect('/');
    } catch (err) {
    const { budget } = await userService.getBudgetById(req.user._id);
        const ctx = {
            errors: parseError(err),
            title: "Create new car sale",
            brand,
            model,
            region,
            yearOfManufacture,
            engine,
            gearbox,
            imageUrl,
            price,
            budget
        };
        res.render('cars/create', ctx);
    }
});

router.get('/my-cars', isUser, async(req, res) => {
    const {budget} = await userService.getBudgetById(req.user._id);
    const cars = await userService.getAllCarsByUserId(req.user._id);
    const context = {
        ...cars,
        title: "My Cars Page",
        budget
    };
    res.render('cars/my-cars', context);
});


router.get('/:carId/details', async(req, res) => {
    const carId = req.params.carId;
    try {
        const car = await carService.getCarById(carId);
        await carService.addView(carId);
        let context;
        if (req.user) {
            const { budget } = await userService.getBudgetById(req.user._id);
            const isOwner = car.owner == req.user?._id;
            const { favouriteCars } = await userService.getFavouriteCarsByUserId(req.user?._id);
            const hasItInFavourites = favouriteCars.some((car) => car._id == carId);
            context = {
                ...car,
                isOwner,
                hasItInFavourites,
                title: `${car.brand} ${car.model} details page`,
                budget
            };
        } else {
            context = {...car, title: `${car.brand} ${car.model} details page` }
        };
        res.render('cars/details', context);
    } catch (err) {
        const error = parseError(err);
        console.log(error);
        res.redirect('/');
    };
});


router.get('/:carId/delete', isUser, async(req, res) => {
    try {
        await carService.deleteById(req.params.carId, req.user._id);
        res.redirect('/cars/my-cars');
    } catch (error) {
        const errors = parseError(error);
        res.render(`cars/details`, errors);
    }
});


router.get('/:carId/edit', isUser, async(req, res) => {
    const car = await carService.getCarById(req.params.carId);
    const { budget } = await userService.getBudgetById(req.user._id);

    const context = {
        ...car,
        title: `Edit your ${car.brand} ${car.model}`,
        budget
    }
    res.render('cars/edit', context);
});

router.post('/:carId/edit', isUser, async(req, res) => {
    try {
        await carService.editCarById(req.body, req.params.carId);
        res.redirect('/cars/my-cars');
    } catch (error) {
        const context = {
            errors: parseError(error),

        }
        res.render('cars/edit', context);
    };
});

router.get('/:carId/addToFavourites', isUser, async(req, res) => {
    try {
    const { budget } = await userService.getBudgetById(req.user._id);
        await carService.addToFavourites(req.params.carId, req.user._id);
        const favouriteCars = await userService.getFavouriteCarsByUserId(req.user._id);
        const context = {
            ...favouriteCars,
            title: "My Favourite Cars",
            budget
        };
        res.render('cars/favourite-cars', context);
    } catch (err) {
        res.redirect(`/cars/${req.params.carId}/details`);
    }
});

router.get('/favourite-cars', async(req, res) => {
    const { budget } = await userService.getBudgetById(req.user._id);
    const favouriteCars = await userService.getFavouriteCarsByUserId(req.user._id);
    const context = {
        ...favouriteCars,
        title: "My Favourite Cars",
        budget
    };
    res.render('cars/favourite-cars', context);
});

router.get('/:carId/removeFromFavourites', isUser, async(req, res) => {
    try {
    const { budget } = await userService.getBudgetById(req.user._id);
        await carService.removeFromFavourites(req.params.carId, req.user._id);
        const car = await carService.getCarById(req.params.carId);
        const context = {...car,budget};
        res.render('cars/details', context);
    } catch (error) {
        const context = {
            errors: parseError(error)
        };
        res.render('cars/details', context);
    }
});

router.get('/:carId/buy', isUser, async(req, res) => {
    const carId = req.params.carId;

    try {
       await userService.buyCarById(req.user._id, carId); 
        res.redirect('/cars/my-cars');
    } catch (err) {
    const { budget } = await userService.getBudgetById(req.user._id);
        let errors = parseError(err)
        let car =await carService.getCarById(carId);
        console.log(car);
        const context = {
            ...car,
            errors,
            budget
        };
        res.render('cars/details',context);
    };
});



module.exports = router;