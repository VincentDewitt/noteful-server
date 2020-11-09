const express = require('express')
const logger = require('../logger')
const folderService = require('./folder-service')
const Knex = require('knex')
const { DATABASE_URL } = require('../../config')
const xss = require('xss')
const path = require('path')
const notesService = require('../notes/notes-service')

const folderRouter = express.Router()
const bodyParser = express.json()

const serializeFolder = folder => ({

    folder_name: folder.folder_name,
})

folderRouter
    .route('/')
    
    .get((req, res, next) => {
        folderService.getAllFolders(req.app.get('db'))
            .then(folders => {
                res.json(folders.map(serializeFolder))
            })
            .catch(next)
    })

    .post(bodyParser, (req,res,next) => {
        const { folder_name } = req.body
        const newFolder = folder_name
        const newFolderObject = {folder_name: newFolder}

        if(folder_name === undefined){
         return res.status(400).send({
            error: { message: `${field} is required`}
         })
            }

        
        folderService.insertFolder(
            req.app.get('db'),
            newFolderObject
        )
            .then( folder => {
                logger.info(`Folder Created with id = (${folder.id}) and folder_name = (${folder.folder_name})`)
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `${folder.id}`))
                    .json(serializeFolder(folder))
            })
            .catch(next)
    })

    folderRouter
        .route('/:folder_name')
        .all((req,res,next) => {
            const { folder_name } = req.params
            folderService.getByFolderName(req.app.get('db'), folder_name)
                .then(folder =>{
                    if (!folder){
                        logger.error(`Folder with name '${folder_name}' not found.`)
                        return res.status(404).json({
                            error: { message: `Folder not found`}
                        })
                    }
                    res.folder = folder
                    next()
                })
                .catch(next)
        })

        .get((req,res, next) => {
            res.json(serializeFolder(res.folder))
        })

        .delete((req,res, next) => {
            const { folder_name } = req.params
            folderService.deleteFolder(
                req.app.get('db'),
                folder_name
            )
            .then(numRowsAffected => {
                logger.info(`Folder with name '${folder_name}' deleted.`)
               return  res.status(204).end()
            })
            .catch(next)
        })

        module.exports = folderRouter

