use std::pin::Pin;

use futures::{stream, Stream, StreamExt};

use crate::{api::client::Client, result::Result, types::StreamContent, Error};

use self::params::{OpenAIChatParams, OpenAIChatRole};

use super::response::OpenAIErrorResponse;

pub mod params;

pub struct OpenAIChatApi {
    client: Client,
    host: String,
}

impl OpenAIChatApi {
    pub fn new(client: Client, host: &str) -> Self {
        Self {
            client,
            host: host.to_string(),
        }
    }

    pub async fn send_message(
        &self,
        params: OpenAIChatParams,
    ) -> Result<Pin<Box<dyn Stream<Item = StreamContent> + Send + '_>>> {
        let url = self.host.clone() + "/v1/chat/completions";

        log::debug!("url: {}", url);
        log::debug!("params: {:?}", params);

        let res = self.client.post(&url, params).await?;

        let stream = res.bytes_stream();

        let mut left_chunk: Option<Vec<u8>> = None;
        let mut left_line: Option<String> = None;
        let stream = stream
            .flat_map(move |chunk| {
                if let Err(err) = chunk {
                    let err: Error = err.into();
                    return stream::iter(vec![StreamContent::Error(err.into())]);
                }

                let mut vec = chunk.unwrap().to_vec();
                if let Some(left_chunk) = left_chunk.take() {
                    vec = [left_chunk, vec].concat();
                }

                let Ok(data) = String::from_utf8(vec.clone()) else {
                    left_chunk = Some(vec);
                    return stream::iter(vec![]);
                };

                if data.starts_with("{\n    \"error\"") || data.starts_with("{\n  \"error\"") {
                    let res = serde_json::from_str::<OpenAIErrorResponse>(&data).unwrap();
                    let err: Error = res.into();
                    return stream::iter(vec![StreamContent::Error(err.into())]);
                }

                let chunks = data
                    .lines()
                    .filter_map(|line| {
                        let line = line.trim();
                        log::debug!("line: {}", line);
                        if line.is_empty() {
                            None
                        } else if line.starts_with("data: [DONE]") {
                            Some(StreamContent::Done)
                        } else {
                            let line = left_line.take().unwrap_or_default() + line;
                            match handle_line(&line) {
                                Some(Some(content)) => Some(content),
                                Some(None) => None,
                                None => {
                                    left_line = Some(line);
                                    None
                                }
                            }
                        }
                    })
                    .collect::<Vec<StreamContent>>();

                stream::iter(chunks)
            })
            .boxed();

        Ok(stream)
    }
}

#[derive(serde::Deserialize, Debug)]
pub struct OpenAIStreamChunk {
    pub object: String,
    pub model: String,
    pub choices: Vec<OpenAIStreamChunkChoice>,
}

#[derive(serde::Deserialize, Debug)]
pub struct OpenAIStreamChunkChoice {
    pub delta: OpenAIStreamChunkChoiceDelta,
    pub index: Option<usize>,
    pub finish_reason: Option<OpenAIFinishReason>,
}

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum OpenAIFinishReason {
    Stop,
    Length,
    ContentFilter,
}

#[derive(serde::Deserialize, Debug)]
pub struct OpenAIStreamChunkChoiceDelta {
    pub role: Option<OpenAIChatRole>,
    pub content: Option<String>,
}

fn handle_line(line: &str) -> Option<Option<StreamContent>> {
    log::debug!("handle_line: {}", line);
    if !line.starts_with("data:") {
        return None;
    }
    let json_data = if line.starts_with("data: {") {
        &line[6..]
    } else if line.starts_with("data:{") {
        &line[5..]
    } else {
        return None;
    };
    match serde_json::from_str::<OpenAIStreamChunk>(json_data) {
        Ok(json) => {
            let stream_content = json.choices.get(0).and_then(|choice| {
                choice
                    .delta
                    .content
                    .as_ref()
                    .map(|content| StreamContent::Data(content.to_string()))
            });

            Some(stream_content)
        }
        Err(_err) => None,
    }
}
