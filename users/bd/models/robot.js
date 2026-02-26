const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Robot', {
        id_player: { 
            type: DataTypes.INTEGER, 
            primaryKey: true 
        },
        behaviour_type: { 
            type: DataTypes.STRING(100), 
            allowNull: false 
        }
    }, { 
        tableName: 'Robot', 
        timestamps: false 
    });
};