const express = require('express')
const logger = require('../logger')
const { v4: uudid } = require('uuid')
const notesService = require('./notes-service')
const Knex = require('knex')
const { DB_URL } = require('../../config')
const xss = require('xss')
const path = require('path')

const notesRouter = express.Router()
const bodyParser = express.json()

const serializeNote = note => ({
    title: xss(note.title),
    content: xss(note.content),
    folder_id: (note.folder_id),
})

notesRouter
    .route('/')

    .get((req,res, next) => {
        notesService.getAllNotes(req.app.get('db'))
        .then(notes => {
            res.json(notes.map(serializeNote))
        })
        .catch(next)
    })

    .post(bodyParser, (req,res, next) => {
        const {title, content, folder} = req.body
        const newNote = {title, content, folder}

        for (const field of ['title','content']){
            if (!newNote[field]){
                logger.error(`${field} is required`)
                return res.status(400).send({
                    error: { message: `'${field}' is required` }
                })
            }
        }
        notesService.insertNotes(
            req.app.get('db'),
            newNote
        )
            .then( notes => {
                logger.info(`Note with id ${notes.id} created`)
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `${notes.id}`))
                    .json(serializeNote(notes))
            })
            .catch(next)
    })

    notesRouter
        .route('/:note_id')
        .all((req,res,next) => {
            const { note_id } = req.params
            notesService.getNoteById(req.app.get('db'), note_id)
                .then(notes => {
                    if (!notes){
                        logger.error(`Note with id ${note_id} not found.`)
                        return res.status(404).json({
                            error: { message: `Note Not Found`}
                        })
                    }
                    res.notes = notes
                    next()
                })
                .catch(next)

        })

        .get((req,res) => {
            res.json(serializeNote(res.notes))
        })

        .delete((req,res,next) => {
            const { note_id } = req.params
            notesService.deleteNote(
                req.app.get('db'),
                note_id
            )
            .then(numRowsAffected => {
                logger.info(`Note with id ${note_id} deleted.`)
                return res.status(204).end()
            })
            .catch(next)
        })

        .patch(bodyParser, (req,res,next) => {
            const {title, content, folder_id} = req.body
            const noteToUpdate = {title, content, folder_id}

            const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
            if (numberOfValues === 0) {
                logger.error('Invlaid update without required fields')
                return res.status(400).json({
                    error: {
                        message: `Request body must contain 'title', 'content' and folder_id`
                    }
                })
            }
            notesService.updateNote(
                req.app.get('db'),
                req.params.note_id,
                noteToUpdate
            )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
        })

        module.exports = notesRouter