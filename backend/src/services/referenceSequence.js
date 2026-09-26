const Sequence = require('../models/Sequence');

const nextReferenceSequence = async (key, model) => {
    const currentCount = await model.countDocuments();

    try {
        await Sequence.updateOne(
            { _id: key },
            { $setOnInsert: { value: currentCount } },
            { upsert: true }
        );
    } catch (error) {
        if (error.code !== 11000) throw error;
    }

    const sequence = await Sequence.findOneAndUpdate(
        { _id: key },
        { $inc: { value: 1 } },
        { returnDocument: 'after', upsert: true }
    );

    return sequence.value;
};

module.exports = nextReferenceSequence;